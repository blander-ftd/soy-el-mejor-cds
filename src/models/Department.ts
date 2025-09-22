import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * Department Model - Represents a department document in the 'departments' Firestore collection
 * 
 * Collection: departments
 * Document ID: Department name or auto-generated
 * 
 * This model represents organizational departments in the company.
 */

export type DepartmentName = string;

/**
 * NominatedEntry - Represents a nominated user entry in a department
 */
export interface NominatedEntry {
  /** Number of votes received */
  votes: number;
  
  /** ID of the nominated user */
  user: string;
  
  /** ID of the event this nomination belongs to */
  event: string;
  
  /** Array of user IDs who voted for this nominee */
  votedby: string[];
  
  /** Survey result score (single integer) */
  surveyResult: number;
}

export interface Department extends DocumentData {
  /** Unique identifier for the department */
  id: string;
  
  /** Name of the department */
  name: DepartmentName;
  
  /** Display name for the department (can be localized) */
  displayName?: string;
  
  /** Description of the department */
  description?: string;
  
  /** Array of supervisor user IDs in this department */
  supervisorIds?: string[];
  
  /** Array of coordinator user IDs in this department */
  coordinatorIds?: string[];
  
  /** Array of collaborator user IDs in this department */
  collaboratorIds?: string[];

  /** List of nominated entries for this department */
  nominatedList?: NominatedEntry[];

  /** Number of winners allowed in this department for voting events */
  winnersQuantity?: number;
  
  /** Whether this department is active */
  isActive?: boolean;
  
  /** Department budget or other numerical data */
  budget?: number;
  
  /** Department location/office */
  location?: string;
  
  /** Department contact email */
  contactEmail?: string;
  
  /** Department phone number */
  phoneNumber?: string;
  
  /** Custom metadata for the department */
  metadata?: Record<string, any>;
  
  /** Timestamp when the department was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the department was last updated */
  updatedAt?: Timestamp;
  
  /** User ID who created this department */
  createdBy?: string;
}

/**
 * Firestore document converter for Department
 */
export const departmentConverter = {
  toFirestore: (department: Department): DocumentData => {
    const { id, ...departmentData } = department;
    return {
      ...departmentData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): Department => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Department;
  }
};

/**
 * Default department data for development/testing
 */
export const createDefaultDepartment = (overrides: Partial<Department> = {}): Omit<Department, 'id'> => ({
  name: 'Transporte',
  isActive: true,
  supervisorIds: [],
  coordinatorIds: [],
  collaboratorIds: [],
  nominatedList: [],
  winnersQuantity: 1,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});

/**
 * Predefined departments with their display names and descriptions
 */
export const PREDEFINED_DEPARTMENTS: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Transporte',
    displayName: 'Transporte',
    description: 'Departamento de logística y transporte de mercancías',
    isActive: true,
    supervisorIds: ['trans-sup-1'],
    coordinatorIds: ['trans-coord-1'],
    collaboratorIds: ['trans-col-1', 'trans-col-2', 'trans-col-3', 'trans-col-4', 'trans-col-5'],
    nominatedList: [],
    winnersQuantity: 1
  },
  {
    name: 'Gestion de Inventario',
    displayName: 'Gestión de Inventario',
    description: 'Departamento de control y gestión de inventarios',
    isActive: true,
    supervisorIds: ['inv-sup-1'],
    coordinatorIds: ['inv-coord-1'],
    collaboratorIds: ['inv-col-1', 'inv-col-2', 'inv-col-3', 'inv-col-4', 'inv-col-5'],
    nominatedList: [],
    winnersQuantity: 1
  },
  {
    name: 'Recursos Humanos',
    displayName: 'Recursos Humanos',
    description: 'Departamento de recursos humanos y gestión de personal',
    isActive: true,
    supervisorIds: ['rh-sup-1'],
    coordinatorIds: ['rh-coord-1'],
    collaboratorIds: ['rh-col-1', 'rh-col-2', 'rh-col-3', 'rh-col-4', 'rh-col-5'],
    nominatedList: [],
    winnersQuantity: 1
  }
];
