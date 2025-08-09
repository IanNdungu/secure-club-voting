
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, CircleCheck, Lock, Shield } from "lucide-react";
import { format } from "date-fns";
import { useElections } from '@/contexts/ElectionContext';
import { useAuth } from '@/contexts/AuthContext';

const ElectionResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getElectionById, getElectionResults } = useElections();
  const { user } = useAuth();
  
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
  
  // Get the results
  const results = getElectionResults(id);
  
  // Check if results are available
  const resultsAvailable = election.status === 'closed' || (user && user.role === 'admin');
  
  // Get total votes
  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
  
  // Format dates for display
  const startDate = format(new Date(election.startDate), "MMMM d, yyyy");
  const endDate = format(new Date(election.endDate), "MMMM d, yyyy");
  
  // Sort candidates by vote count (descending)
  const sortedCandidates = [...election.candidates].sort((a, b) => 
    (results[b.id] || 0) - (results[a.id] || 0)
  );
  
  // Get the winner if election is closed
  const getWinner = () => {
    if (election.status !== 'closed' || totalVotes === 0) return null;
    
    let maxVotes = 0;
    let winnerId = '';
    let isTie = false;
    
    for (const [candidateId, votes] of Object.entries(results)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winnerId = candidateId;
        isTie = false;
      } else if (votes === maxVotes && votes > 0) {
        isTie = true;
      }
    }
    
    if (isTie) return null;
    
    return election.candidates.find(c => c.id === winnerId);
  };
  
  const winner = getWinner();
  
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
            <CardTitle className="text-2xl">Results: {election.title}</CardTitle>
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
              <CircleCheck className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'} Cast</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!resultsAvailable ? (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium">Results are not available yet</h3>
              <p className="text-muted-foreground mt-2">
                Results will be visible once the election has concluded.
              </p>
            </div>
          ) : totalVotes === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No votes have been cast yet</h3>
              <p className="text-muted-foreground mt-2">
                Check back later to see the results.
              </p>
            </div>
          ) : (
            <>
              {winner && (
                <div className="mb-8 bg-vote-100 p-4 rounded-lg border border-vote-200 text-center">
                  <div className="inline-block p-2 rounded-full bg-vote-200 mb-2">
                    <CircleCheck className="h-6 w-6 text-vote-800" />
                  </div>
                  <h3 className="text-lg font-bold text-vote-900">Winner: {winner.name}</h3>
                  <p className="text-vote-800 mt-1">
                    With {results[winner.id]} {results[winner.id] === 1 ? 'vote' : 'votes'} 
                    ({totalVotes > 0 ? Math.round((results[winner.id] / totalVotes) * 100) : 0}%)
                  </p>
                </div>
              )}
              
              <h3 className="text-lg font-medium mb-4">Vote Breakdown</h3>
              <div className="space-y-6">
                {sortedCandidates.map((candidate) => {
                  const voteCount = results[candidate.id] || 0;
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={candidate.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{candidate.name}</span>
                        <span className="text-muted-foreground">
                          {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={winner && candidate.id === winner.id ? "h-3 bg-muted" : "h-2 bg-muted"} 
                      />
                      {candidate.description && (
                        <p className="text-xs text-muted-foreground">{candidate.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          <div className="mt-8 p-4 bg-secure-100 rounded-lg border border-secure-200 flex items-center">
            <Shield className="h-5 w-5 text-secure-600 mr-3 flex-shrink-0" />
            <p className="text-sm text-secure-800">
              Results are calculated securely from encrypted ballots. Individual votes remain anonymous and cannot be traced back to voters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectionResults;
