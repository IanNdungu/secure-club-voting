
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Vote, Lock, CircleCheck, Calendar } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="container py-8">
      <section className="text-center py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-vote-100">
              <Shield className="h-16 w-16 text-vote-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Secure Club Voting Platform</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Confidential, encrypted, and role-based voting system for club members
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Button 
                size="lg" 
                className="bg-vote-600 hover:bg-vote-700"
                onClick={() => navigate('/elections')}
              >
                <Vote className="mr-2 h-5 w-5" />
                View Elections
              </Button>
            ) : (
              <Button 
                size="lg"
                className="bg-vote-600 hover:bg-vote-700"
                onClick={() => navigate('/login')}
              >
                <Lock className="mr-2 h-5 w-5" />
                Secure Login
              </Button>
            )}
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-slate-50 rounded-lg px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Key Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-secure-100 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-secure-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Secure Authentication</h3>
              <p className="text-muted-foreground">
                Password-protected access ensures only authorized club members can participate in elections.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-vote-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-vote-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Different permissions for admins and voters ensure proper separation of duties and election integrity.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <CircleCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">One Person, One Vote</h3>
              <p className="text-muted-foreground">
                System enforces that each member can only vote once per election while maintaining anonymity.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Vote className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Anonymous Voting</h3>
              <p className="text-muted-foreground">
                Votes are stored separately from voter identities, ensuring confidentiality and privacy.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Scheduled Elections</h3>
              <p className="text-muted-foreground">
                Elections can be scheduled with specific start and end dates to automate the voting process.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Audit Logging</h3>
              <p className="text-muted-foreground">
                All actions are securely logged for compliance and transparency while preserving vote secrecy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
