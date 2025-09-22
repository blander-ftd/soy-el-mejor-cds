import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * Vote Model - Represents a vote document in the 'votes' Firestore collection
 * 
 * Collection: votes
 * Document ID: Auto-generated
 * 
 * This model represents votes cast by users for nominated collaborators in voting events.
 */

export interface Vote extends DocumentData {
  /** Unique identifier for the vote */
  id: string;
  
  /** ID of the voting event this vote belongs to */
  eventId: string;
  
  /** ID of the user who cast the vote */
  voterId: string;
  
  /** Array of collaborator IDs that were voted for */
  votedForIds: string[];
  
  /** When the vote was cast */
  voteDate: Timestamp;
  
  /** Department of the voter (for analytics) */
  voterDepartment?: string;
  
  /** Whether this vote is valid/active */
  isValid?: boolean;
  
  /** Optional metadata about the vote */
  metadata?: {
    /** IP address from where the vote was cast */
    ipAddress?: string;
    /** User agent of the browser */
    userAgent?: string;
    /** Any additional tracking info */
    [key: string]: any;
  };
  
  /** Timestamp when the vote was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the vote was last updated */
  updatedAt?: Timestamp;
}

/**
 * Firestore document converter for Vote
 */
export const voteConverter = {
  toFirestore: (vote: Vote): DocumentData => {
    const { id, ...voteData } = vote;
    return {
      ...voteData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): Vote => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Vote;
  }
};

/**
 * Default vote data for development/testing
 */
export const createDefaultVote = (overrides: Partial<Vote> = {}): Omit<Vote, 'id'> => ({
  eventId: '',
  voterId: '',
  votedForIds: [],
  voteDate: Timestamp.now(),
  isValid: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});
