
export type UserRole = 'admin' | 'voter';

export interface User {
  id: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  role: UserRole;
  email?: string;
}

export interface Candidate {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
}

export interface Election {
  id: string;
  electionCode: string; // This is the code that admins share with voters
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  candidates: Candidate[];
  status: 'upcoming' | 'active' | 'closed';
  registrationStatus: 'open' | 'closed';
  createdBy: string; // admin ID
  createdAt: Date;
}

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  timestamp: Date;
  // No voter ID stored here to ensure anonymity
}

export interface VoterRecord {
  voterId: string;
  electionId: string;
  hasVoted: boolean;
  timestamp?: Date;
  // This separates the vote itself from the voter identity
}

export interface AuditLog {
  id: string;
  action: 'login' | 'logout' | 'vote_cast' | 'election_created' | 'election_closed' | 'user_registered';
  userId?: string; // Optional for anonymous actions
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface VoterCode {
  code: string;
  electionId: string;
  isUsed: boolean;
  email?: string;
  createdAt: Date;
  usedAt?: Date;
  createdBy: string; // admin who created this code
}

export interface VoterRegistration {
  id: string;
  electionId: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // admin ID
  voterCodeId?: string; // ID of the assigned voter code
}
