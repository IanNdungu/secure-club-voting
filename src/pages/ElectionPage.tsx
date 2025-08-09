
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ElectionDetail from '@/components/ElectionDetail';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const ElectionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access elections",
        variant: "destructive",
      });
      navigate('/login', { state: { from: window.location.pathname } });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything, will redirect in useEffect
  }

  return <ElectionDetail />;
};

export default ElectionPage;
