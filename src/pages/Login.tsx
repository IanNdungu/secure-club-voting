
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return URL from state or default to home
  const from = location.state?.from?.pathname || '/';
  
  // UseEffect to handle redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, isLoading]);
  
  // Don't render anything during initial load or redirect
  if (isLoading || isAuthenticated) {
    return null;
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <LoginForm />
    </div>
  );
};

export default Login;
