import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElections } from '@/contexts/ElectionContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Shield, CircleX, CircleCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { Candidate } from '@/types';
import { toast } from '@/components/ui/use-toast';

// Define form schema
const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  startDate: z.string().refine(date => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'Start date must be today or in the future.',
  }),
  endDate: z.string().refine(date => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'End date must be today or in the future.',
  }),
});

const CreateElectionForm = () => {
  const { createElection } = useElections();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateName, setCandidateName] = useState('');
  const [candidateDescription, setCandidateDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from today
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (candidates.length < 2) {
      form.setError('root', {
        message: 'You need at least 2 candidates for an election.',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the election - note this is now async
      await createElection({
        title: values.title,
        description: values.description,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        candidates: candidates,
      });
      
      // Redirect to elections list
      toast({
        title: "Success",
        description: "Election created successfully",
      });
      
      // Delay navigation slightly to allow toast to be visible
      setTimeout(() => {
        navigate('/elections');
      }, 1000);
    } catch (error) {
      console.error('Error creating election:', error);
      toast({
        title: "Error",
        description: "Failed to create election. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  // Add candidate
  const addCandidate = () => {
    if (candidateName.trim() === '') return;
    
    setCandidates([
      ...candidates,
      {
        id: uuidv4(),
        name: candidateName.trim(),
        description: candidateDescription.trim() || undefined,
      },
    ]);
    
    // Clear inputs
    setCandidateName('');
    setCandidateDescription('');
  };
  
  // Remove candidate
  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter(candidate => candidate.id !== id));
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Button variant="outline" onClick={() => navigate('/elections')} className="mb-6">
        Back to Elections
      </Button>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-vote-600" />
            <CardTitle className="text-2xl">Create New Election</CardTitle>
          </div>
          <CardDescription>
            Set up a new secure election for club members to vote in.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Election Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Board President Election" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear title describing what members will be voting on.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide details about this election..." 
                        className="min-h-24" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Additional context about the election to help voters make informed decisions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Candidates</h3>
                
                <div className="space-y-4 mb-6">
                  {candidates.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-md">
                      <p className="text-muted-foreground">No candidates added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {candidates.map((candidate) => (
                        <div 
                          key={candidate.id}
                          className="flex items-start justify-between p-3 border rounded-md bg-slate-50"
                        >
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            {candidate.description && (
                              <p className="text-sm text-muted-foreground">{candidate.description}</p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeCandidate(candidate.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <CircleX className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                  <div className="space-y-2">
                    <FormLabel>Candidate Name</FormLabel>
                    <Input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter candidate name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Description (optional)</FormLabel>
                    <Textarea
                      value={candidateDescription}
                      onChange={(e) => setCandidateDescription(e.target.value)}
                      placeholder="Brief candidate description or platform"
                    />
                  </div>
                  
                  <Button type="button" onClick={addCandidate} className="w-full">
                    Add Candidate
                  </Button>
                </div>
                
                {candidates.length < 2 && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center">
                    <CircleX className="h-4 w-4 mr-1" />
                    At least 2 candidates are required.
                  </p>
                )}
              </div>
              
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}
              
              <div className="p-4 bg-secure-100 rounded-lg border border-secure-200 flex items-center">
                <Shield className="h-5 w-5 text-secure-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-secure-800">
                  Your election will be secured with end-to-end encryption and anonymized voting to ensure integrity and voter privacy.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-vote-600 hover:bg-vote-700"
                disabled={isSubmitting || candidates.length < 2}
              >
                {isSubmitting ? (
                  'Creating Election...'
                ) : (
                  <>
                    <CircleCheck className="mr-2 h-4 w-4" />
                    Create Secure Election
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateElectionForm;
