
import React, { useState } from 'react';
import { useElections } from '@/contexts/ElectionContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { Search } from 'lucide-react';
import ElectionCard from './ElectionCard';
import VoterRegistration from './VoterRegistration';
import ElectionAccessForm from './ElectionAccessForm';

const SearchElection = () => {
  const { elections } = useElections();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedElection, setSearchedElection] = useState<typeof elections[0] | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter an election ID",
        variant: "destructive",
      });
      return;
    }

    const foundElection = elections.find(
      (election) => election.electionCode.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (foundElection) {
      setSearchedElection(foundElection);
      setRegistrationComplete(false);
      setAccessGranted(false);
      toast({
        title: "Election Found",
        description: `Found election: ${foundElection.title}`,
      });
    } else {
      setSearchedElection(null);
      toast({
        title: "Not Found",
        description: "No election found with that ID",
        variant: "destructive",
      });
    }
  };

  const handleRegistrationComplete = () => {
    setRegistrationComplete(true);
  };

  const handleAccessGranted = () => {
    setAccessGranted(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Find Your Election</h2>
        <p className="mb-4 text-muted-foreground">
          Enter the election ID provided by your administrator to access your election.
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter election ID (e.g., CH2025)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>

      {searchedElection && (
        <div className="mt-8">
          {!registrationComplete && !accessGranted ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Election Found</h2>
              <div className="grid grid-cols-1 gap-6">
                <ElectionCard election={searchedElection} />
                <VoterRegistration 
                  election={searchedElection} 
                  onRegistered={handleRegistrationComplete} 
                />
              </div>
            </>
          ) : registrationComplete && !accessGranted ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Registration Complete</h2>
              <div className="grid grid-cols-1 gap-6">
                <Card className="p-6">
                  <div className="text-center py-4">
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-lg mb-2">Registration Pending Approval</h3>
                      <p>
                        Your registration has been submitted and is awaiting admin approval. 
                        Once approved, you will receive an email with a unique voter code.
                      </p>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      Already received your voter code? Enter it below to access the election.
                    </p>
                  </div>
                </Card>
                <ElectionAccessForm 
                  electionId={searchedElection.id} 
                  onAccessGranted={handleAccessGranted} 
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Election Access Granted</h2>
              <div className="grid grid-cols-1">
                <ElectionCard election={searchedElection} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchElection;
