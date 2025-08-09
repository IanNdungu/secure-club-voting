import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useElections } from '@/contexts/ElectionContext';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from '@/components/ui/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, AlertCircle } from 'lucide-react';
import { Election } from '@/types';
import { useNavigate } from 'react-router-dom';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface VoterRegistrationProps {
  election: Election;
  onRegistered: () => void;
}

const VoterRegistration = ({ election, onRegistered }: VoterRegistrationProps) => {
  const { user, profile, isAuthenticated } = useAuth();
  const { registerForElection, canRegisterForElection, hasRegisteredForElection } = useElections();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Check if registration is allowed
  const registrationAllowed = canRegisterForElection(election.id);
  
  // Check if already registered
  const alreadyRegistered = user?.email 
    ? hasRegisteredForElection(election.id, user.email)
    : false;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile?.username || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for an election",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Register voter for election
      await registerForElection(election.id, data.name, data.email);
      
      // Show success message
      toast({
        title: "Registration Submitted",
        description: "Your registration is pending admin approval. You will receive a confirmation email when approved.",
      });
      
      onRegistered();
    } catch (error) {
      console.error("Registration error:", error);
      // Error message is already shown by the registerForElection function
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Registration Required</CardTitle>
          <CardDescription>
            You need to log in before you can register for "{election.title}".
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-6">Authentication is required to register for elections.</p>
          <Button onClick={() => navigate('/login')}>
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If registration is closed or election has started
  if (!registrationAllowed) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Registration Closed</CardTitle>
          <CardDescription>
            Registration for "{election.title}" is no longer available.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-2">
            {election.registrationStatus === 'closed' 
              ? "The administrator has closed registration for this election."
              : "Registration is closed because the election has already started."}
          </p>
          <p className="text-sm text-muted-foreground">
            Contact the election administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // If already registered
  if (alreadyRegistered) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Already Registered</CardTitle>
          <CardDescription>
            You have already registered for "{election.title}".
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-4">
            <p className="mb-2 font-medium">Your registration is being processed.</p>
            <p className="text-sm">
              Once approved, you will receive an email with your voting code.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Register for Election</CardTitle>
        <CardDescription>
          Complete this form to register for "{election.title}". 
          Your registration will be reviewed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                      <div className="px-3 border-r">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input className="border-0 focus-visible:ring-0" placeholder="Enter your full name" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                      <div className="px-3 border-r">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input className="border-0 focus-visible:ring-0" type="email" placeholder="Enter your email address" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your approval code will be sent to this email when your registration is approved.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground bg-muted/50">
        <p>Your data will only be used for this election and verification purposes.</p>
      </CardFooter>
    </Card>
  );
};

export default VoterRegistration;
