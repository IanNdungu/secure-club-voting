
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Vote, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Election } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ElectionCardProps {
  election: Election;
}

const ElectionCard: React.FC<ElectionCardProps> = ({ election }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Format dates for display
  const startDate = format(new Date(election.startDate), "MMM d, yyyy");
  const endDate = format(new Date(election.endDate), "MMM d, yyyy");
  
  // Determine status badge style
  let statusVariant: "outline" | "default" | "secondary" | "destructive" = "outline";
  
  if (election.status === 'active') {
    statusVariant = "default";
  } else if (election.status === 'closed') {
    statusVariant = "secondary";
  } else if (election.status === 'upcoming') {
    statusVariant = "outline";
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{election.title}</CardTitle>
          <Badge variant={statusVariant} className="capitalize">
            {election.status}
          </Badge>
        </div>
        <CardDescription>{election.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{startDate} - {endDate}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Vote className="h-4 w-4 mr-2" />
            <span>{election.candidates.length} candidates</span>
          </div>
          {isAdmin && (
            <div className="mt-4 p-2 bg-muted rounded-md flex justify-between items-center">
              <span className="text-xs font-medium">Election ID:</span>
              <Badge variant="outline" className="bg-background font-mono">
                {election.electionCode}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => navigate(`/elections/${election.id}`)} 
          variant="outline" 
          className="w-full"
        >
          View Election <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElectionCard;
