import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useElections } from '@/contexts/ElectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleCheck, Settings, Shield, Vote, User, Users, Calendar, FileText, LogOut, Bell, List, Download, UserPlus, Key } from 'lucide-react';
import { format } from 'date-fns';
import { Election } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import VoterCodeGenerator from '@/components/VoterCodeGenerator';
import { supabase, countActiveVoters, countVotes, fetchElections } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const AdminPage = () => {
  const { user, profile, hasRole, logout, isLoading: authLoading } = useAuth();
  const { updateElectionStatus, getElectionResults } = useElections();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [activeVotersCount, setActiveVotersCount] = useState<number>(0);
  const [totalVotesCount, setTotalVotesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbElections, setDbElections] = useState<Election[]>([]);
  const [upcomingElections, setUpcomingElections] = useState<Election[]>([]);
  const [adminChecked, setAdminChecked] = useState<boolean>(false);
  const [redirectionTimer, setRedirectionTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Check if user is admin, but wait until auth is loaded
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth loaded. User:', user?.id, 'Profile:', profile);
      
      // Clear any existing redirection timer
      if (redirectionTimer) {
        clearTimeout(redirectionTimer);
        setRedirectionTimer(null);
      }
      
      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Add a delay before checking admin role to ensure profile is fully loaded
      const timer = setTimeout(() => {
        if (profile) {
          console.log('Profile loaded, role:', profile.role);
          setAdminChecked(true);
          
          if (profile.role !== 'admin') {
            console.log('User is not admin, redirecting to home');
            toast({
              title: 'Access Denied',
              description: 'You need admin privileges to access this page.',
              variant: 'destructive',
            });
            navigate('/');
          }
        } else {
          // If profile is not available yet, wait and check again
          console.log('Profile not loaded yet, waiting...');
        }
      }, 1000); // 1 second delay
      
      setRedirectionTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [user, profile, authLoading, navigate]);
  
  // Fetch data only after we've confirmed user is admin
  useEffect(() => {
    const fetchStats = async () => {
      if (!adminChecked || !user || !profile || profile.role !== 'admin') {
        return;
      }
      
      try {
        console.log('Fetching admin stats...');
        setLoading(true);
        
        // Get active voters count
        const votersCount = await countActiveVoters();
        setActiveVotersCount(votersCount);
        
        // Get total votes count
        const votesCount = await countVotes();
        setTotalVotesCount(votesCount);
        
        // Get elections directly from the database
        const electionsData = await fetchElections();
        setDbElections(electionsData);
        
        // Filter upcoming elections
        const upcoming = electionsData.filter(e => e.status === 'upcoming');
        setUpcomingElections(upcoming);
        
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load statistics. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Set up realtime subscription only if user is confirmed admin
    if (adminChecked && user && profile?.role === 'admin') {
      const channel = supabase
        .channel('public:elections')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'elections' 
          }, 
          async () => {
            // Refresh elections data when there's a change
            const refreshedElections = await fetchElections();
            setDbElections(refreshedElections);
            setUpcomingElections(refreshedElections.filter(e => e.status === 'upcoming'));
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [adminChecked, user, profile, navigate]);
  
  // Show enhanced loading state while checking authentication
  if (authLoading || !adminChecked || (user && profile === null)) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-vote-600 animate-pulse mb-4" />
            <p className="text-xl font-medium text-muted-foreground">Loading admin panel...</p>
            <p className="text-sm text-muted-foreground mt-2">Verifying admin privileges...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Stop rendering if not authenticated or not admin
  // This is a safety check in addition to the useEffect redirect
  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }
  
  // Change election status
  const handleStatusChange = (election: Election, newStatus: Election['status']) => {
    updateElectionStatus(election.id, newStatus);
  };
  
  // Get total votes for an election
  const getVoteCount = (electionId: string) => {
    const results = getElectionResults(electionId);
    return Object.values(results).reduce((sum, count) => sum + count, 0);
  };
  
  // Calculate statistics from real data
  const stats = {
    totalElections: dbElections.length,
    activeElections: dbElections.filter(e => e.status === 'active').length,
    completedElections: dbElections.filter(e => e.status === 'closed').length,
    upcomingElections: upcomingElections.length,
    totalVoters: activeVotersCount,
    totalVotes: totalVotesCount
  };
  
  return (
    <div className="container py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Shield className="mr-3 h-7 w-7 text-vote-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Secure Club Voting System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-vote-100 text-vote-800">
              <AvatarFallback>{profile?.username ? profile.username.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{profile?.username || user.email}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
      
      {/* Quick Stats Section - Now using real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-vote-100 p-3 mb-2">
              <FileText className="h-6 w-6 text-vote-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.totalElections}</h3>
            <p className="text-sm text-muted-foreground">Total Elections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-green-100 p-3 mb-2">
              <Vote className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.activeElections}</h3>
            <p className="text-sm text-muted-foreground">Active Elections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-blue-100 p-3 mb-2">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.upcomingElections}</h3>
            <p className="text-sm text-muted-foreground">Upcoming Elections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-blue-100 p-3 mb-2">
              <CircleCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.completedElections}</h3>
            <p className="text-sm text-muted-foreground">Completed Elections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-purple-100 p-3 mb-2">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.totalVoters}</h3>
            <p className="text-sm text-muted-foreground">Total Voters</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="rounded-full bg-amber-100 p-3 mb-2">
              <List className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold">{loading ? '...' : stats.totalVotes}</h3>
            <p className="text-sm text-muted-foreground">Votes Cast</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Election Button */}
      <div className="mb-6">
        <Button onClick={() => navigate('/elections/create')} className="bg-vote-600 hover:bg-vote-700">
          <CircleCheck className="mr-2 h-4 w-4" />
          Create New Election
        </Button>
      </div>
      
      {/* Upcoming Elections Section - New */}
      {upcomingElections.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Upcoming Elections
            </CardTitle>
            <CardDescription>Elections that have not started yet</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Election Title</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingElections.map(election => (
                  <TableRow key={election.id}>
                    <TableCell className="font-medium">
                      {election.title}
                      <div className="text-xs text-muted-foreground mt-1">
                        {election.description.substring(0, 50)}
                        {election.description.length > 50 ? '...' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(election.startDate), "MMM d, yyyy")} to {format(new Date(election.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/elections/${election.id}`)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="dashboard">Elections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="voter-codes">Voter Codes</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Elections Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Election Management</CardTitle>
              <CardDescription>
                View and manage all elections in the system. Update status, view results, or create new elections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Election Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Total Votes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">Loading elections...</p>
                      </TableCell>
                    </TableRow>
                  ) : dbElections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No elections have been created yet.</p>
                        <Button onClick={() => navigate('/elections/create')}>
                          Create Your First Election
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dbElections.map((election) => {
                      const startDate = format(new Date(election.startDate), "MMM d, yyyy");
                      const endDate = format(new Date(election.endDate), "MMM d, yyyy");
                      const voteCount = getVoteCount(election.id);
                      
                      return (
                        <TableRow key={election.id}>
                          <TableCell className="font-medium">
                            {election.title}
                            <div className="text-xs text-muted-foreground mt-1">{election.description.substring(0, 50)}{election.description.length > 50 ? '...' : ''}</div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={election.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {startDate} to {endDate}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Vote className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{voteCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select 
                                defaultValue={election.status}
                                onValueChange={(value) => {
                                  if (value !== election.status) {
                                    handleStatusChange(election, value as Election['status']);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upcoming">Upcoming</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button variant="outline" size="sm" onClick={() => navigate(`/elections/${election.id}`)}>
                                Details
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => navigate(`/elections/${election.id}/results`)}>
                                Results
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts. Add, remove, or modify users as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock user list for demo */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-vote-100 text-vote-800">
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <span>admin</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-vote-50 text-vote-800">Admin</Badge>
                      </TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800">Active</Badge></TableCell>
                      <TableCell><Button variant="outline" size="sm" disabled>Edit</Button></TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-secure-100 text-secure-800">
                            <AvatarFallback>V1</AvatarFallback>
                          </Avatar>
                          <span>voter1</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">Voter</Badge>
                      </TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800">Active</Badge></TableCell>
                      <TableCell><Button variant="outline" size="sm" disabled>Edit</Button></TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-secure-100 text-secure-800">
                            <AvatarFallback>V2</AvatarFallback>
                          </Avatar>
                          <span>voter2</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">Voter</Badge>
                      </TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800">Active</Badge></TableCell>
                      <TableCell><Button variant="outline" size="sm" disabled>Edit</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="mt-4">
                  <Button disabled>Add New User</Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    In a real implementation, you would be able to add new users and manage existing ones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Voter Codes Tab */}
        <TabsContent value="voter-codes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Voter Code Management
              </CardTitle>
              <CardDescription>
                Generate and manage unique voter codes that grant access to specific elections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbElections.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Select an election to manage voter codes</h4>
                    <Select
                      value={selectedElectionId}
                      onValueChange={setSelectedElectionId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an election" />
                      </SelectTrigger>
                      <SelectContent>
                        {dbElections.map((election) => (
                          <SelectItem key={election.id} value={election.id}>
                            {election.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedElectionId ? (
                    <VoterCodeGenerator electionId={selectedElectionId} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select an election to manage voter codes
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No elections have been created yet</p>
                  <Button onClick={() => navigate('/elections/create')}>
                    Create Your First Election
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs & Reports</CardTitle>
              <CardDescription>
                Review all system activities for security and compliance purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm">{format(new Date(), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                      <TableCell>Login</TableCell>
                      <TableCell>admin</TableCell>
                      <TableCell>Successful login attempt</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">{format(new Date(Date.now() - 3600000), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                      <TableCell>Vote Cast</TableCell>
                      <TableCell>voter1</TableCell>
                      <TableCell>Vote cast in election "Board President Election"</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">{format(new Date(Date.now() - 7200000), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                      <TableCell>Election Created</TableCell>
                      <TableCell>admin</TableCell>
                      <TableCell>Created election "Budget Allocation Vote"</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Export Logs (CSV)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Center</CardTitle>
              <CardDescription>
                Monitor and manage system security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Vote Encryption</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Vote Integrity Checks</span>
                        <Badge className="bg-green-100 text-green-800">Passing</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>System Backup</span>
                        <Badge className="bg-green-100 text-green-800">Up to Date</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Login History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Current Session</span>
                        <span className="text-muted-foreground">{format(new Date(), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Last Login</span>
                        <span className="text-muted-foreground">{format(new Date(Date.now() - 86400000), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p>2FA Status for your account</p>
                        <p className="text-sm text-muted-foreground">Enhance your account security with 2FA</p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-800">Not Enabled</Badge>
                    </div>
                    <div className="mt-4">
                      <Button disabled>Configure 2FA</Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        In a real implementation, this would allow you to enable and configure 2FA.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Badge component for election status
const StatusBadge = ({ status }: { status: Election['status'] }) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'upcoming':
      return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
    case 'closed':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Add Avatar component (used in the page)
const Avatar = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
      {children}
    </div>
  );
};

const AvatarFallback = ({ children }: { children: React.ReactNode }) => {
  return <div className="font-medium">{children}</div>;
};

export default AdminPage;
