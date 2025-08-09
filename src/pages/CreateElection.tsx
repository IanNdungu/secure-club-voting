
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateElectionForm from '@/components/CreateElectionForm';
import { toast } from '@/components/ui/use-toast';

const CreateElection = () => {
  const { user, hasRole, profile } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Debug information
    console.log('CreateElection page - Auth state:', { 
      isLoggedIn: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      profile: profile,
      isAdmin: profile?.role === 'admin',
      hasAdminRole: hasRole('admin')
    });
    
    // Only redirect if not admin
    if (!user) {
      console.log('Redirecting: User not logged in');
      toast({
        title: "Authentication required",
        description: "Please log in to create an election",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    if (!hasRole('admin')) {
      console.log('Redirecting: User does not have admin role');
      toast({
        title: "Permission denied",
        description: "Only administrators can create elections",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
  }, [user, hasRole, navigate]);
  
  return <CreateElectionForm />;
};

export default CreateElection;
