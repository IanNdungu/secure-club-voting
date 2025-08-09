
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ElectionsList from '@/components/ElectionsList';
import SearchElection from '@/components/SearchElection';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { useElections } from '@/contexts/ElectionContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, mapDatabaseElectionToAppElection } from '@/integrations/supabase/client';
import { Election } from '@/types';
import { Plus } from 'lucide-react';
import ElectionCard from '@/components/ElectionCard';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const Elections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [adminElections, setAdminElections] = React.useState<Election[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch admin's created elections
  React.useEffect(() => {
    const fetchAdminElections = async () => {
      if (!user || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch elections created by this admin
        const { data: electionsData, error: electionsError } = await supabase
          .from('elections')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (electionsError) {
          console.error('Error fetching admin elections:', electionsError);
          toast({
            title: "Error",
            description: "Failed to load your elections. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // For each election, fetch its candidates
        const elections: Election[] = await Promise.all(
          electionsData.map(async (election) => {
            const { data: candidatesData, error: candidatesError } = await supabase
              .from('candidates')
              .select('*')
              .eq('election_id', election.id);
            
            if (candidatesError) {
              console.error(`Error fetching candidates for election ${election.id}:`, candidatesError);
              return mapDatabaseElectionToAppElection(election, []);
            }
            
            return mapDatabaseElectionToAppElection(election, candidatesData);
          })
        );

        setAdminElections(elections);
      } catch (error) {
        console.error('Failed to fetch admin elections:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading your elections.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminElections();
    
    // Set up realtime subscription for elections table
    const channel = supabase
      .channel('public:elections')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'elections',
          filter: `created_by=eq.${user?.id}` 
        }, 
        () => {
          fetchAdminElections();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Elections</h1>
      
      {isAdmin && (
        <>
          <div className="mb-6">
            <Button 
              onClick={() => navigate('/elections/create')}
              className="bg-vote-600 hover:bg-vote-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Election
            </Button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Elections</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : adminElections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't created any elections yet.</p>
                  <Button onClick={() => navigate('/elections/create')}>
                    Create Your First Election
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">All Elections</h2>
        </>
      )}
      
      {isAdmin ? (
        <ElectionsList />
      ) : (
        <SearchElection />
      )}
    </div>
  );
};

export default Elections;
