
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Vote, User, Lock, CircleCheck, Shield, AlertCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { useElections } from '@/contexts/ElectionContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Input } from "@/components/ui/input";

const ElectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getElectionById, 
    castVote, 
    hasVoted, 
    isVoterApprovedForElection, 
    updateRegistrationStatus,
    updateCandidateName,
    getElectionResults 
  } = useElections();
  const { user, isAuthenticated } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);
  const [newCandidateName, setNewCandidateName] = useState("");
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the election",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check if user is approved for this election
    if (id && user && user.role === 'voter') {
      setIsApproved(isVoterApprovedForElection(id, user.id));
    }
  }, [id, user, isAuthenticated, isVoterApprovedForElection, navigate]);
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  if (!id) {
    return <div>Election ID is missing</div>;
  }
  
  const election = getElectionById(id);
  
  if (!election) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">Election Not Found</h2>
        <p className="text-muted-foreground mb-4">The election you are looking for does not exist.</p>
        <Button onClick={() => navigate('/elections')}>Back to Elections</Button>
      </div>
    );
  }
  
  // Check if user already voted
  const userHasVoted = hasVoted(id);
  
  const handleVote = () => {
    if (!selectedCandidate) return;
    
    setIsSubmitting(true);
    
    try {
      // Cast the vote
      const voteSuccessful = castVote(id, selectedCandidate);
      
      if (voteSuccessful) {
        // Redirect to results page after successful vote
        setTimeout(() => {
          navigate(`/elections/${id}/results`);
        }, 1500);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      setIsSubmitting(false);
    }
  };

  const handleSaveCandidateName = (candidateId: string) => {
    if (newCandidateName.trim()) {
      updateCandidateName(id, candidateId, newCandidateName.trim());
      setEditingCandidate(null);
      setNewCandidateName("");
      toast({
        title: "Candidate Updated",
        description: "The candidate name has been updated successfully.",
      });
    }
  };
  
  const handleEditCandidate = (candidateId: string, currentName: string) => {
    setEditingCandidate(candidateId);
    setNewCandidateName(currentName);
  };
  
  // Format dates for display
  const startDate = format(new Date(election.startDate), "MMMM d, yyyy");
  const endDate = format(new Date(election.endDate), "MMMM d, yyyy");
  
  // Check if election is active and user can vote
  const canVote = election.status === 'active' && !userHasVoted && isApproved && user && user.role === 'voter';
  
  // Check if admin can edit candidates (before election starts)
  const canEditCandidates = user?.role === 'admin' && election.status === 'upcoming';
  
  // Get live voting results if admin
  const liveResults = user?.role === 'admin' ? getElectionResults(id) : {};
  const totalVotes = user?.role === 'admin' ? Object.values(liveResults).reduce((sum, count) => sum + count, 0) : 0;
  
  // Display message if user is not approved
  const renderAccessMessage = () => {
    if (!isApproved && user?.role === 'voter') {
      return (
        <div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-amber-800 mb-1">Not Registered</h3>
          <p className="text-amber-700">
            You are not registered for this election or your registration has not been approved.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => navigate('/elections')}>
            Return to Elections
          </Button>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/elections')}>
          Back to Elections
        </Button>
      </div>
      
      <Card className="shadow-lg border-slate-200">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <CardTitle className="text-2xl">{election.title}</CardTitle>
            <div className="flex items-center gap-2">
              {election.status === 'active' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              )}
              {election.status === 'closed' && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Closed
                </Badge>
              )}
              {election.status === 'upcoming' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Upcoming
                </Badge>
              )}
              <span className="secure-badge">
                <Shield className="h-3 w-3 mr-1" />
                <span>Secure</span>
              </span>
            </div>
          </div>
          <CardDescription className="text-base mt-2">{election.description}</CardDescription>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {startDate} to {endDate}
              </span>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{election.candidates.length} Candidates</span>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm text-blue-700 font-medium">Registration Status: {election.registrationStatus}</p>
              <div className="flex mt-2 gap-2">
                <Button 
                  variant={election.registrationStatus === 'open' ? "outline" : "default"}
                  size="sm"
                  onClick={() => updateRegistrationStatus(election.id, 'open')}
                  disabled={election.registrationStatus === 'open'}
                >
                  Open Registration
                </Button>
                <Button 
                  variant={election.registrationStatus === 'closed' ? "outline" : "default"}
                  size="sm"
                  onClick={() => updateRegistrationStatus(election.id, 'closed')}
                  disabled={election.registrationStatus === 'closed'}
                >
                  Close Registration
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {renderAccessMessage()}
          
          {/* Admin Live Results Section */}
          {user?.role === 'admin' && election.status === 'active' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Live Results</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-green-800">Total Votes Cast</h4>
                  <span className="text-sm font-bold text-green-900">{totalVotes}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {election.candidates.map((candidate) => {
                  const voteCount = liveResults[candidate.id] || 0;
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={`result-${candidate.id}`} className="border rounded-md p-3">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{candidate.name}</span>
                        <span className="font-medium">{voteCount} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs mt-1 text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {(isApproved || user?.role === 'admin') && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-4">Candidates</h3>
              
              {user?.role === 'voter' && userHasVoted ? (
                <div className="text-center py-4">
                  <CircleCheck className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">You have already cast your vote in this election.</p>
                  <p className="text-sm text-muted-foreground mt-1">Check the results page for current standings.</p>
                </div>
              ) : user?.role === 'voter' && election.status !== 'active' ? (
                <div className="text-center py-4">
                  {election.status === 'upcoming' ? (
                    <>
                      <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-600 font-medium">Voting begins on {startDate}</p>
                    </>
                  ) : (
                    <>
                      <Lock className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">This election is now closed.</p>
                    </>
                  )}
                </div>
              ) : user?.role === 'voter' ? (
                <RadioGroup
                  value={selectedCandidate || ""}
                  onValueChange={setSelectedCandidate}
                  className="space-y-3"
                  disabled={!canVote}
                >
                  {election.candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} />
                      <div className="flex-1">
                        <Label htmlFor={`candidate-${candidate.id}`} className="text-base font-medium cursor-pointer">
                          {candidate.name}
                        </Label>
                        {candidate.description && (
                          <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                // Admin candidate list with edit capability
                <div className="space-y-3">
                  {election.candidates.map((candidate) => (
                    <div key={candidate.id} className="border rounded-lg p-4">
                      {editingCandidate === candidate.id ? (
                        <div className="flex flex-col space-y-2">
                          <Input
                            value={newCandidateName}
                            onChange={(e) => setNewCandidateName(e.target.value)}
                            className="font-medium"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingCandidate(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleSaveCandidateName(candidate.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-medium">{candidate.name}</h4>
                            {candidate.description && (
                              <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                            )}
                          </div>
                          {canEditCandidates && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditCandidate(candidate.id, candidate.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-secure-100 rounded-lg border border-secure-200 flex items-center">
            <Lock className="h-5 w-5 text-secure-600 mr-3 flex-shrink-0" />
            <p className="text-sm text-secure-800">
              All votes are encrypted and stored anonymously. Your privacy is protected, and your
              vote cannot be traced back to you.
            </p>
          </div>
        </CardContent>
        
        {canVote && (
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-vote-600 hover:bg-vote-700 w-full"
                  disabled={!selectedCandidate || isSubmitting}
                >
                  <Vote className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Processing...' : 'Cast My Vote'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to cast your vote for <strong>
                      {selectedCandidate 
                        ? election.candidates.find(c => c.id === selectedCandidate)?.name
                        : ''}
                    </strong>.
                    <br /><br />
                    This action cannot be undone. Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleVote} className="bg-vote-600 hover:bg-vote-700">
                    <Shield className="h-4 w-4 mr-2" />
                    Confirm Vote
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
        
        {userHasVoted && user?.role === 'voter' && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate(`/elections/${id}/results`)}
            >
              View Results
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ElectionDetail;
