import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * VotingEvent Model - Represents a voting event document in the 'voting_events' Firestore collection
 * 
 * Collection: voting_events
 * Document ID: Auto-generated or custom event ID
 * 
 * This model represents voting events that can be department-specific or company-wide.
 */

export type VotingEventStatus = "Pending" | "Active" | "Closed";
export type EventDepartment = "Technology" | "Marketing" | "Sales" | "Human Resources" | "All Departments";

export interface SurveyQuestion extends DocumentData {
  /** Title of the survey question */
  title: string;
  
  /** Full body text of the question */
  body: string;
}

export interface VotingEvent extends DocumentData {
  /** Unique identifier for the voting event */
  id: string;
  
  /** Name/title of the event (e.g., "Agosto 2024") */
  month: string;
  
  /** Department this event is for, always "All Departments" for company-wide events */
  department: "All Departments";
  
  /** Current status of the voting event */
  status: VotingEventStatus;
  
  /** When the event starts */
  startDate?: Timestamp;
  
  /** When the event ends */
  endDate?: Timestamp;
  
  /** When the nomination phase ends */
  nominationEndDate?: Timestamp;
  
  /** When the voting phase ends */
  votingEndDate?: Timestamp;
  
  /** When the evaluation phase ends */
  evaluationEndDate?: Timestamp;
  
  /** Survey questions for peer evaluation */
  surveyQuestions: SurveyQuestion[];
  
  /** Custom message for winner announcement */
  winnerMessage?: string;
  
  /** Timestamp when the event was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the event was last updated */
  updatedAt?: Timestamp;
  
  /** User ID who created this event */
  createdBy?: string;
}

/**
 * Firestore document converter for VotingEvent
 */
export const votingEventConverter = {
  toFirestore: (event: VotingEvent): DocumentData => {
    const { id, ...eventData } = event;
    
    // Filter out undefined values
    const cleanData: any = {};
    Object.keys(eventData).forEach(key => {
      const value = (eventData as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    return {
      ...cleanData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): VotingEvent => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as VotingEvent;
  }
};

/**
 * Default voting event data for development/testing
 */
export const createDefaultVotingEvent = (overrides: Partial<VotingEvent> = {}): Omit<VotingEvent, 'id'> => ({
  month: '',
  department: 'All Departments',
  status: 'Pending',
  surveyQuestions: [
    { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
    { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
    { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
    { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
    { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
  ],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});
