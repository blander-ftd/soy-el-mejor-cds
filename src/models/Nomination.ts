import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * Nomination Model - Represents a nomination document in the 'nominations' Firestore collection
 * 
 * Collection: nominations
 * Document ID: Auto-generated
 * 
 * This model represents nominations made by supervisors for collaborators in voting events.
 */

export interface Nomination extends DocumentData {
  /** Unique identifier for the nomination */
  id: string;
  
  /** ID of the voting event this nomination belongs to */
  eventId: string;
  
  /** ID of the collaborator being nominated */
  collaboratorId: string;
  
  /** ID of the user who made the nomination (typically a supervisor) */
  nominatedById: string;
  
  /** When the nomination was made */
  nominationDate: Timestamp;
  
  /** Optional reason or comment for the nomination */
  reason?: string;
  
  /** Department of the nominated collaborator (for filtering) */
  department?: string;
  
  /** Whether this nomination is active/valid */
  isActive?: boolean;
  
  /** Timestamp when the nomination was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the nomination was last updated */
  updatedAt?: Timestamp;
}

/**
 * Firestore document converter for Nomination
 */
export const nominationConverter = {
  toFirestore: (nomination: Nomination): DocumentData => {
    const { id, ...nominationData } = nomination;
    return {
      ...nominationData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): Nomination => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Nomination;
  }
};

/**
 * Default nomination data for development/testing
 */
export const createDefaultNomination = (overrides: Partial<Nomination> = {}): Omit<Nomination, 'id'> => ({
  eventId: '',
  collaboratorId: '',
  nominatedById: '',
  nominationDate: Timestamp.now(),
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});
