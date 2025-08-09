
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElections } from '@/contexts/ElectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ElectionCard from './ElectionCard';
import { CircleCheck, Shield } from 'lucide-react';
import { supabase, fetchElections } from '@/integrations/supabase/client';
import { Election } from '@/types';
import { toast } from '@/components/ui/use-toast';

const ElectionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadElections = async () => {
      try {
        setLoading(true);
        const data = await fetchElections();
        setElections(data);
      } catch (error) {
        console.error('Error loading elections:', error);
        toast({
          title: 'Error',
          description: 'Failed to load elections. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadElections();
    
    // Set up realtime subscription for elections table
    const channel = supabase
      .channel('public:elections')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'elections' 
        }, 
        () => {
          loadElections();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const activeElections = elections.filter((election) => election.status === 'active');
  const upcomingElections = elections.filter((election) => election.status === 'upcoming');
  const closedElections = elections.filter((election) => election.status === 'closed');
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // If user is not admin and they're on the elections list page, they shouldn't see any elections
  if (!isAdmin && elections.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Search for an Election</h2>
          <p className="text-muted-foreground mb-6">
            Please use the search box above to enter the Election ID provided by your administrator.
          </p>
        </div>
      </div>
    );
  }
  
  if (elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Elections Yet</h2>
          <p className="text-muted-foreground mb-6">
            There are currently no elections available in the system.
          </p>
          {isAdmin && (
            <Button onClick={() => navigate('/elections/create')} className="bg-vote-600 hover:bg-vote-700">
              <CircleCheck className="mr-2 h-4 w-4" />
              Create First Election
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-10">
      {/* Admin button to create new election */}
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => navigate('/elections/create')} className="bg-vote-600 hover:bg-vote-700">
            <CircleCheck className="mr-2 h-4 w-4" />
            Create New Election
          </Button>
        </div>
      )}
      
      {/* Active elections section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="bg-green-100 text-green-800 rounded-full h-6 w-6 flex items-center justify-center mr-2">
            <span className="animate-pulse h-3 w-3 rounded-full bg-green-500"></span>
          </span>
          Active Elections
        </h2>
        {activeElections.length === 0 ? (
          <p className="text-muted-foreground">No active elections at this time.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {activeElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>
      
      {/* Upcoming elections section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Elections</h2>
        {upcomingElections.length === 0 ? (
          <p className="text-muted-foreground">No upcoming elections scheduled.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>
      
      {/* Past elections section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Closed Elections</h2>
        {closedElections.length === 0 ? (
          <p className="text-muted-foreground">No closed elections yet.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {closedElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>
      
      {/* Security info at the bottom */}
      <div className="mt-10 p-4 bg-secure-100 rounded-lg border border-secure-200 flex items-center">
        <Shield className="h-6 w-6 text-secure-600 mr-4 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-secure-900 mb-1">Secure Voting Platform</h3>
          <p className="text-sm text-secure-800">
            All votes are encrypted and stored anonymously. Your privacy is protected, and 
            your vote cannot be traced back to you. Election results are calculated securely to ensure integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElectionsList;
