import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: { username: string; role: UserRole } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, username?: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ username: string; role: UserRole } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Fetch user profile data with better error handling and logging
  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      console.error('Cannot fetch profile: No user ID provided');
      return;
    }

    setProfileLoading(true);
    console.log('Fetching profile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
        }
      } else if (data) {
        console.log('Profile data loaded successfully:', data);
        setProfile({
          username: data.username,
          role: data.role as UserRole
        });
      } else {
        console.warn('No profile data returned for user:', userId);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Initialize auth state and set up listener with improved logging
  useEffect(() => {
    console.log('Setting up auth listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sessionData) => {
        console.log('Auth state changed:', event, sessionData?.user?.id);
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setIsAuthenticated(!!sessionData);
        
        if (sessionData?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserProfile(sessionData.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
      console.log('Initial session check:', sessionData?.user?.id);
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      setIsAuthenticated(!!sessionData);
      
      if (sessionData?.user) {
        fetchUserProfile(sessionData.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user has a specific role with additional safety checks
  const hasRole = (role: UserRole): boolean => {
    if (profileLoading) {
      console.log('Profile is still loading, cannot check role yet');
      return false;
    }
    
    console.log('Checking role:', role, 'Current profile:', profile);
    return profile?.role === role;
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Login successful",
          description: `Welcome back!`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred during login",
        variant: "destructive",
      });
      return false;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, username?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Signup successful",
        description: "Your account has been created",
      });
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred during signup",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Signed out",
      description: "You have been successfully logged out",
    });
  };

  // Context value
  const value = {
    user,
    profile,
    isAuthenticated,
    isLoading,
    session,
    login,
    signUp,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
