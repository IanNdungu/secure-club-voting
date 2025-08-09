import React, { createContext, useContext, useState, useEffect } from 'react';
import { Election, Candidate, Vote, VoterRecord, VoterCode, VoterRegistration } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase, mapDatabaseElectionToAppElection } from '@/integrations/supabase/client';

interface ElectionContextType {
  elections: Election[];
  loading: boolean;
  voterCodes: VoterCode[];
  voterRegistrations: VoterRegistration[];
  createElection: (election: Omit<Election, 'id' | 'createdBy' | 'createdAt' | 'status' | 'electionCode' | 'registrationStatus'>) => void;
  updateElectionStatus: (electionId: string, status: Election['status']) => void;
  updateRegistrationStatus: (electionId: string, registrationStatus: Election['registrationStatus']) => void;
  castVote: (electionId: string, candidateId: string) => boolean;
  hasVoted: (electionId: string) => boolean;
  getElectionResults: (electionId: string) => Record<string, number>;
  getElectionById: (id: string) => Election | undefined;
  generateVoterCodes: (electionId: string, count: number, emails?: string[]) => string[];
  getVoterCodesByElection: (electionId: string) => VoterCode[];
  validateVoterCode: (code: string, electionId: string) => boolean;
  markVoterCodeAsUsed: (code: string) => void;
  registerForElection: (electionId: string, name: string, email: string) => Promise<void>;
  getVoterRegistrationsByElection: (electionId: string) => VoterRegistration[];
  updateVoterRegistrationStatus: (registrationId: string, status: 'approved' | 'rejected', adminId: string) => Promise<void>;
  getPendingRegistrations: () => VoterRegistration[];
  hasRegisteredForElection: (electionId: string, email: string) => boolean;
  canRegisterForElection: (electionId: string) => boolean;
  isVoterApprovedForElection: (electionId: string, voterId: string) => boolean;
  updateCandidateName: (electionId: string, candidateId: string, newName: string) => void;
}

// Simple encryption function (for demonstration)
// In a real app, use proper cryptographic libraries
const encryptVote = (voteData: string): string => {
  // Simple base64 encoding for demonstration
  return btoa(`secure-${voteData}-${Date.now()}`);
};

// Generate a unique election code
const generateElectionCode = (): string => {
  // Format: 2 letters + 4 numbers
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed easily confusable characters
  const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const numbers = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${letter1}${letter2}${numbers}`;
};

// Generate a unique voter code
const generateUniqueVoterCode = (): string => {
  // Format: 8 characters alphanumeric (uppercase)
  return uuidv4().substring(0, 8).toUpperCase();
};

// Mock initial data
const MOCK_ELECTIONS: Election[] = [
  {
    id: '1',
    electionCode: 'AB1234',
    title: 'Board President Election',
    description: 'Vote for the next board president of our club',
    startDate: new Date(Date.now() - 86400000), // Yesterday
    endDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
    candidates: [
      {
        id: '101',
        name: 'Jane Smith',
        description: 'Current Vice President with 5 years of experience',
      },
      {
        id: '102',
        name: 'Michael Wong',
        description: 'Committee Chair with innovative ideas for club growth',
      },
      {
        id: '103',
        name: 'Sarah Johnson',
        description: 'Long-time member focusing on community engagement',
      }
    ],
    status: 'active',
    registrationStatus: 'open',
    createdBy: '1',
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  },
  {
    id: '2',
    electionCode: 'CD5678',
    title: 'Budget Allocation Vote',
    description: 'Vote on how to allocate this year\'s budget surplus',
    startDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    endDate: new Date(Date.now() + 86400000 * 9), // 9 days from now
    candidates: [
      {
        id: '201',
        name: 'Facility Improvements',
        description: 'Upgrade equipment and renovate meeting spaces',
      },
      {
        id: '202',
        name: 'Community Outreach',
        description: 'Fund more community events and marketing',
      },
      {
        id: '203',
        name: 'Membership Benefits',
        description: 'Enhance benefits and resources for members',
      }
    ],
    status: 'upcoming',
    registrationStatus: 'open',
    createdBy: '1',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  }
];

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voterRecords, setVoterRecords] = useState<VoterRecord[]>([]);
  const [voterCodes, setVoterCodes] = useState<VoterCode[]>([]);
  const [voterRegistrations, setVoterRegistrations] = useState<VoterRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load mock data on component mount
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setElections(MOCK_ELECTIONS);
      
      // Load any stored votes from localStorage
      try {
        const storedVotes = localStorage.getItem('secureVotes');
        if (storedVotes) {
          setVotes(JSON.parse(storedVotes));
        }
        
        const storedRecords = localStorage.getItem('voterRecords');
        if (storedRecords) {
          setVoterRecords(JSON.parse(storedRecords));
        }

        const storedVoterCodes = localStorage.getItem('voterCodes');
        if (storedVoterCodes) {
          setVoterCodes(JSON.parse(storedVoterCodes));
        }
        
        const storedRegistrations = localStorage.getItem('voterRegistrations');
        if (storedRegistrations) {
          setVoterRegistrations(JSON.parse(storedRegistrations));
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    if (votes.length > 0) {
      localStorage.setItem('secureVotes', JSON.stringify(votes));
    }
  }, [votes]);

  useEffect(() => {
    if (voterRecords.length > 0) {
      localStorage.setItem('voterRecords', JSON.stringify(voterRecords));
    }
  }, [voterRecords]);
  
  useEffect(() => {
    if (voterCodes.length > 0) {
      localStorage.setItem('voterCodes', JSON.stringify(voterCodes));
    }
  }, [voterCodes]);
  
  useEffect(() => {
    if (voterRegistrations.length > 0) {
      localStorage.setItem('voterRegistrations', JSON.stringify(voterRegistrations));
    }
  }, [voterRegistrations]);

  // Log audit record
  const logAudit = (action: string, details: string) => {
    console.log(`AUDIT: ${action} - ${details} - ${new Date().toISOString()}`);
    // In a real app, this would be sent to a secure audit log service
  };

  // Create a new election
  const createElection = async (electionData: Omit<Election, 'id' | 'createdBy' | 'createdAt' | 'status' | 'electionCode' | 'registrationStatus'>) => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can create elections",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Insert into Supabase
      const { data: electionResult, error: electionError } = await supabase
        .from('elections')
        .insert({
          title: electionData.title,
          description: electionData.description,
          start_date: electionData.startDate.toISOString(),
          end_date: electionData.endDate.toISOString(),
          created_by: user.id,
          status: new Date() >= electionData.startDate ? 'active' : 'upcoming',
          registration_status: 'open',
          election_code: generateElectionCode(), // This function is defined above in the file
        })
        .select()
        .single();
      
      if (electionError) {
        console.error("Error creating election:", electionError);
        toast({
          title: "Error creating election",
          description: electionError.message,
          variant: "destructive",
        });
        return;
      }
      
      // Now insert the candidates
      const candidatePromises = electionData.candidates.map(candidate => {
        return supabase
          .from('candidates')
          .insert({
            election_id: electionResult.id,
            name: candidate.name,
            description: candidate.description || null,
          });
      });
      
      const candidateResults = await Promise.all(candidatePromises);
      const candidateErrors = candidateResults.filter(result => result.error);
      
      if (candidateErrors.length > 0) {
        console.error("Error creating candidates:", candidateErrors);
        toast({
          title: "Warning",
          description: "Election created but some candidates may not have been saved properly.",
          variant: "destructive",
        });
      }
      
      // Fetch the created candidates to return a complete election object
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionResult.id);
      
      // Create full election object
      const newElection = mapDatabaseElectionToAppElection(
        electionResult, 
        candidatesData || []
      );
      
      // Update local state
      setElections(prev => [...prev, newElection]);
      
      logAudit('election_created', `Election "${newElection.title}" created by ${user.id} with code ${newElection.electionCode}`);
      
      toast({
        title: "Election created",
        description: `${newElection.title} has been successfully created with code: ${newElection.electionCode}`,
      });
      
    } catch (error) {
      console.error("Error in createElection:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating your election.",
        variant: "destructive",
      });
    }
  };

  // Update election status
  const updateElectionStatus = (electionId: string, status: Election['status']) => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can update election status",
        variant: "destructive",
      });
      return;
    }
    
    setElections(prev => 
      prev.map(election => 
        election.id === electionId 
          ? { ...election, status } 
          : election
      )
    );
    
    logAudit('election_updated', `Election ${electionId} status updated to ${status} by ${user.id}`);
    
    toast({
      title: "Election updated",
      description: `Election status has been updated to ${status}`,
    });
  };

  // Update registration status for an election
  const updateRegistrationStatus = (electionId: string, registrationStatus: Election['registrationStatus']) => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can update registration status",
        variant: "destructive",
      });
      return;
    }
    
    setElections(prev => 
      prev.map(election => 
        election.id === electionId 
          ? { ...election, registrationStatus } 
          : election
      )
    );
    
    logAudit('election_registration_updated', `Election ${electionId} registration status updated to ${registrationStatus} by ${user.id}`);
    
    toast({
      title: "Registration status updated",
      description: `Election registration is now ${registrationStatus}`,
    });
  };

  // Check if a voter is approved for an election
  const isVoterApprovedForElection = (electionId: string, voterId: string): boolean => {
    if (!user) return false;
    
    // Find the user's registration
    const registration = voterRegistrations.find(
      reg => reg.electionId === electionId && reg.email === user.email
    );
    
    // If no registration or not approved, return false
    if (!registration || registration.status !== 'approved') return false;
    
    // Check if the voter code exists and is valid
    const voterCode = voterCodes.find(code => code.code === registration.voterCodeId);
    return !!voterCode;
  };

  // Cast a vote
  const castVote = (electionId: string, candidateId: string): boolean => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if user is an admin (admins can't vote)
    if (user.role === 'admin') {
      toast({
        title: "Admin cannot vote",
        description: "Administrators are not allowed to vote in elections",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if the election exists and is active
    const election = elections.find(e => e.id === electionId);
    if (!election) {
      toast({
        title: "Election not found",
        description: "The election you are trying to vote in does not exist",
        variant: "destructive",
      });
      return false;
    }
    
    if (election.status !== 'active') {
      toast({
        title: "Voting not allowed",
        description: `This election is currently ${election.status}`,
        variant: "destructive",
      });
      return false;
    }
    
    // Check if the user is registered and approved for this election
    if (!isVoterApprovedForElection(electionId, user.id)) {
      toast({
        title: "Not authorized",
        description: "You must be a registered and approved voter for this election",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if user has already voted
    if (hasVoted(electionId)) {
      toast({
        title: "Already voted",
        description: "You have already cast your vote in this election",
        variant: "destructive",
      });
      return false;
    }
    
    // Create encrypted vote
    const voteData = {
      id: uuidv4(),
      electionId,
      candidateId,
      timestamp: new Date(),
    };
    
    // In a real app, the vote would be encrypted here
    const encryptedVoteData = encryptVote(JSON.stringify(voteData));
    console.log("Encrypted vote:", encryptedVoteData);
    
    // Save the vote
    setVotes(prev => [...prev, voteData]);
    
    // Record that the user has voted, but keep the vote itself separate
    setVoterRecords(prev => [
      ...prev, 
      {
        voterId: user.id,
        electionId,
        hasVoted: true,
        timestamp: new Date(),
      }
    ]);
    
    logAudit('vote_cast', `Vote cast in election "${election.title}" by user ${user.id}`);
    
    toast({
      title: "Vote cast successfully",
      description: "Your vote has been securely recorded",
    });
    
    return true;
  };

  // Check if voter can register for an election
  const canRegisterForElection = (electionId: string): boolean => {
    if (!user) return false;
    
    const election = elections.find(e => e.id === electionId);
    if (!election) return false;
    
    // Registration is not allowed if:
    // 1. Election has started (active or closed)
    // 2. Registration is closed by admin
    return election.status === 'upcoming' && election.registrationStatus === 'open';
  };

  // Register for an election
  const registerForElection = async (electionId: string, name: string, email: string): Promise<void> => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to register for an election",
        variant: "destructive",
      });
      throw new Error("Authentication required");
    }
    
    // Check if the election exists
    const election = elections.find(e => e.id === electionId);
    if (!election) {
      toast({
        title: "Election not found",
        description: "The election you are trying to register for does not exist",
        variant: "destructive",
      });
      throw new Error("Election not found");
    }
    
    // Check if registration is allowed
    if (!canRegisterForElection(electionId)) {
      toast({
        title: "Registration closed",
        description: "Registration for this election is closed or the election has already started",
        variant: "destructive",
      });
      throw new Error("Registration closed");
    }
    
    // Check if already registered
    if (hasRegisteredForElection(electionId, email)) {
      toast({
        title: "Already registered",
        description: "You have already registered for this election",
        variant: "destructive",
      });
      throw new Error("Already registered");
    }
    
    // Create registration record
    const newRegistration: VoterRegistration = {
      id: uuidv4(),
      electionId,
      name,
      email,
      status: 'pending',
      submittedAt: new Date(),
    };
    
    setVoterRegistrations(prev => [...prev, newRegistration]);
    
    logAudit('user_registered', `User ${name} (${email}) registered for election "${election.title}"`);
    
    return Promise.resolve();
  };
  
  // Check if user has registered for an election
  const hasRegisteredForElection = (electionId: string, email: string): boolean => {
    return voterRegistrations.some(
      reg => reg.electionId === electionId && reg.email.toLowerCase() === email.toLowerCase()
    );
  };
  
  // Get registrations for a specific election
  const getVoterRegistrationsByElection = (electionId: string): VoterRegistration[] => {
    if (!user || user.role !== 'admin') {
      return [];
    }
    
    return voterRegistrations.filter(reg => reg.electionId === electionId);
  };
  
  // Get all pending registrations
  const getPendingRegistrations = (): VoterRegistration[] => {
    if (!user || user.role !== 'admin') {
      return [];
    }
    
    return voterRegistrations.filter(reg => reg.status === 'pending');
  };
  
  // Update registration status and generate voter code if approved
  const updateVoterRegistrationStatus = async (
    registrationId: string, 
    status: 'approved' | 'rejected',
    adminId: string
  ): Promise<void> => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can update registration status",
        variant: "destructive",
      });
      throw new Error("Permission denied");
    }
    
    // Find the registration
    const registration = voterRegistrations.find(reg => reg.id === registrationId);
    if (!registration) {
      toast({
        title: "Registration not found",
        description: "The registration you are trying to update does not exist",
        variant: "destructive",
      });
      throw new Error("Registration not found");
    }
    
    // Update registration status
    setVoterRegistrations(prev => 
      prev.map(reg => 
        reg.id === registrationId
          ? { 
              ...reg, 
              status, 
              reviewedAt: new Date(), 
              reviewedBy: adminId 
            }
          : reg
      )
    );
    
    // If approved, generate a voter code
    if (status === 'approved') {
      // Generate a unique code
      const code = generateUniqueVoterCode();
      
      const newVoterCode: VoterCode = {
        code,
        electionId: registration.electionId,
        isUsed: false,
        email: registration.email,
        createdAt: new Date(),
        createdBy: adminId,
      };
      
      // Add the code to the voter codes
      setVoterCodes(prev => [...prev, newVoterCode]);
      
      // Update the registration with the voter code ID
      setVoterRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId
            ? { ...reg, voterCodeId: code }
            : reg
        )
      );
      
      logAudit('voter_registration_approved', 
        `Admin ${adminId} approved registration for ${registration.name} (${registration.email}) for election ${registration.electionId}`
      );
      
      // In a real app, send an email with the voter code here
      console.log(`SENDING EMAIL to ${registration.email} with voter code: ${code}`);
    } else {
      logAudit('voter_registration_rejected', 
        `Admin ${adminId} rejected registration for ${registration.name} (${registration.email}) for election ${registration.electionId}`
      );
    }
    
    return Promise.resolve();
  };

  // Generate unique voter codes for an election
  const generateVoterCodes = (electionId: string, count: number, emails?: string[]): string[] => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can generate voter codes",
        variant: "destructive",
      });
      return [];
    }
    
    const election = elections.find(e => e.id === electionId);
    if (!election) {
      toast({
        title: "Election not found",
        description: "Cannot generate codes for a non-existent election",
        variant: "destructive",
      });
      return [];
    }
    
    const newCodes: VoterCode[] = [];
    const generatedCodes: string[] = [];
    
    // Generate the specified number of unique codes
    for (let i = 0; i < count; i++) {
      // Generate a unique code - first 8 chars of a UUID
      const code = uuidv4().substring(0, 8).toUpperCase();
      
      generatedCodes.push(code);
      newCodes.push({
        code,
        electionId,
        isUsed: false,
        createdAt: new Date(),
        createdBy: user.id,
      });
    }
    
    // Add the new codes to the state
    setVoterCodes(prev => [...prev, ...newCodes]);
    
    logAudit('voter_codes_generated', `Admin ${user.id} generated ${count} voter codes for election "${election.title}"`);
    
    toast({
      title: "Voter codes generated",
      description: `${count} unique voter codes have been created`,
    });
    
    return generatedCodes;
  };
  
  // Get voter codes for a specific election
  const getVoterCodesByElection = (electionId: string): VoterCode[] => {
    if (!user || user.role !== 'admin') {
      return [];
    }
    
    return voterCodes.filter(code => code.electionId === electionId);
  };
  
  // Validate a voter code for an election
  const validateVoterCode = (code: string, electionId: string): boolean => {
    const voterCode = voterCodes.find(
      c => c.code === code && c.electionId === electionId && !c.isUsed
    );
    
    return !!voterCode;
  };
  
  // Mark a voter code as used
  const markVoterCodeAsUsed = (code: string): void => {
    setVoterCodes(prev => 
      prev.map(voterCode => 
        voterCode.code === code
          ? { ...voterCode, isUsed: true, usedAt: new Date() }
          : voterCode
      )
    );
  };

  // Check if a user has voted in a specific election
  const hasVoted = (electionId: string): boolean => {
    if (!user) return false;
    
    return voterRecords.some(
      record => record.voterId === user.id && record.electionId === electionId
    );
  };

  // Get election results - updated to always return results for admins
  const getElectionResults = (electionId: string): Record<string, number> => {
    const election = elections.find(e => e.id === electionId);
    if (!election) return {};
    
    // Only allow viewing results if the election is closed or the user is an admin
    if (election.status !== 'closed' && (!user || user.role !== 'admin')) {
      return {};
    }
    
    const results: Record<string, number> = {};
    
    // Initialize all candidates with zero votes
    election.candidates.forEach(candidate => {
      results[candidate.id] = 0;
    });
    
    // Count votes
    votes
      .filter(vote => vote.electionId === electionId)
      .forEach(vote => {
        if (results[vote.candidateId] !== undefined) {
          results[vote.candidateId]++;
        }
      });
    
    return results;
  };

  // Get an election by ID
  const getElectionById = (id: string): Election | undefined => {
    return elections.find(election => election.id === id);
  };

  // Update candidate name
  const updateCandidateName = (electionId: string, candidateId: string, newName: string) => {
    if (!user || !profile || profile.role !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can update candidate names",
        variant: "destructive",
      });
      return;
    }
    
    // Find the election
    const election = elections.find(e => e.id === electionId);
    if (!election) {
      toast({
        title: "Election not found",
        description: "The election you are trying to update does not exist",
        variant: "destructive",
      });
      return;
    }
    
    // Check if election has already started
    if (election.status !== 'upcoming') {
      toast({
        title: "Update not allowed",
        description: "Candidate names can only be updated before an election starts",
        variant: "destructive",
      });
      return;
    }
    
    // Update the candidate name
    setElections(prev => prev.map(election => {
      if (election.id === electionId) {
        return {
          ...election,
          candidates: election.candidates.map(candidate => {
            if (candidate.id === candidateId) {
              return { ...candidate, name: newName };
            }
            return candidate;
          })
        };
      }
      return election;
    }));
    
    logAudit('candidate_name_updated', `Admin ${user.id} updated candidate ${candidateId} name to "${newName}" in election ${electionId}`);
  };

  // Value for the context provider
  const value: ElectionContextType = {
    elections,
    loading,
    voterCodes,
    voterRegistrations,
    createElection,
    updateElectionStatus,
    updateRegistrationStatus,
    castVote,
    hasVoted,
    getElectionResults,
    getElectionById,
    generateVoterCodes,
    getVoterCodesByElection,
    validateVoterCode,
    markVoterCodeAsUsed,
    registerForElection,
    getVoterRegistrationsByElection,
    updateVoterRegistrationStatus,
    getPendingRegistrations,
    hasRegisteredForElection,
    canRegisterForElection,
    isVoterApprovedForElection,
    updateCandidateName,
  };

  return <ElectionContext.Provider value={value}>{children}</ElectionContext.Provider>;
};

export const useElections = (): ElectionContextType => {
  const context = useContext(ElectionContext);
  if (context === undefined) {
    throw new Error('useElections must be used within an ElectionProvider');
  }
  return context;
};
