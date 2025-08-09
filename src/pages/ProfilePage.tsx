
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProfilePage = () => {
  const { user, profile, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-md animate-pulse">
            <div className="h-48"></div>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-vote-100 flex items-center justify-center">
                <User className="h-8 w-8 text-vote-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile?.username || user.email}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`
                    ${profile?.role === 'admin' ? 'bg-vote-100 text-vote-800' : 'bg-blue-100 text-blue-800'}
                  `}>
                    {profile?.role === 'admin' ? 'Administrator' : 'Club Member'}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {profile?.username && (
                  <div className="p-4 bg-slate-50 border rounded-md space-y-1">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                )}
                
                <div className="p-4 bg-slate-50 border rounded-md space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                
                <div className="p-4 bg-slate-50 border rounded-md space-y-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{profile?.role || 'voter'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-secure-100 rounded-lg border border-secure-200 flex items-center">
                <Shield className="h-5 w-5 text-secure-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-secure-800">
                  Your account is protected using secure authentication. All voting activity is encrypted and your privacy is maintained.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 w-full" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
