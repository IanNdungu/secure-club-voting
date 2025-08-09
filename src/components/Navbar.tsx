
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Navbar = () => {
  const { user, profile, logout, hasRole, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-vote-600" />
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            SecureClubVote
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-4">
          <Button variant="link" asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button variant="link" asChild>
            <Link to="/elections">Elections</Link>
          </Button>
          {profile && hasRole('admin') && (
            <Button variant="link" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          )}
        </nav>
        
        <div>
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8 bg-vote-100 text-vote-800">
                    <AvatarFallback>
                      {profile?.username ? profile.username.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{profile?.username || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.username || user.email}</span>
                    <span className="text-xs text-muted-foreground">{profile?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {profile && hasRole('admin') && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Log In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
