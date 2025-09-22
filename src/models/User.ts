import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * User Model - Represents a user document in the 'users' Firestore collection
 * 
 * Collection: users
 * Document ID: Firebase Auth UID
 * 
 * This model represents users in the voting system with different roles and departments.
 */

export type UserRole = "Admin" | "Supervisor" | "Coordinator" | "Collaborator";
export type UserDepartment = "Technology" | "Marketing" | "Sales" | "Human Resources";

export interface User extends DocumentData {
  /** Unique identifier for the user (matches Firebase Auth UID) */
  id: string;
  
  /** Full name of the user */
  name: string;
  
  /** Email address (must match Firebase Auth email) */
  email: string;
  
  /** National ID number (cedula) - optional for some users */
  cedula?: string;
  
  /** User's role in the system */
  role: UserRole;
  
  /** Department the user belongs to */
  department: UserDepartment;
  
  /** URL to user's avatar image */
  avatar: string;
  
  /** Timestamp when the user was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the user was last updated */
  updatedAt?: Timestamp;
  
  /** Whether the user is active in the system */
  isActive?: boolean;
}

/**
 * Firestore document converter for User
 */
export const userConverter = {
  toFirestore: (user: User): DocumentData => {
    const { id, ...userData } = user;
    return {
      ...userData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): User => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as User;
  }
};

/**
 * Default user data for development/testing
 */
export const createDefaultUser = (overrides: Partial<User> = {}): Omit<User, 'id'> => ({
  name: '',
  email: '',
  role: 'Collaborator',
  department: 'Technology',
  avatar: 'https://picsum.photos/100',
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});
