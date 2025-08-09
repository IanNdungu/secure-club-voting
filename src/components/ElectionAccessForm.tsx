
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useElections } from '@/contexts/ElectionContext';
import { toast } from '@/components/ui/use-toast';
import { Key } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  voterCode: z.string().min(6, "Voter code must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface ElectionAccessFormProps {
  electionId: string;
  onAccessGranted: () => void;
}

const ElectionAccessForm = ({ electionId, onAccessGranted }: ElectionAccessFormProps) => {
  const { validateVoterCode, markVoterCodeAsUsed } = useElections();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voterCode: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Validate the voter code for this election
      const isValid = validateVoterCode(data.voterCode, electionId);
      
      if (isValid) {
        // Mark the code as used
        markVoterCodeAsUsed(data.voterCode);
        
        toast({
          title: "Access Granted",
          description: "Your voter code has been validated. You can now access the election.",
        });
        
        onAccessGranted();
      } else {
        toast({
          title: "Invalid Code",
          description: "The voter code you entered is invalid or has already been used.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Verification Failed",
        description: "There was a problem verifying your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Enter Your Voter Code</CardTitle>
        <CardDescription>
          Please enter the voter code sent to your email
          after your registration was approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="voterCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voter Code</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                      <div className="px-3 border-r">
                        <Key className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input 
                        className="border-0 focus-visible:ring-0" 
                        placeholder="Enter your unique voter code"
                        autoComplete="off"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Access Election"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ElectionAccessForm;
