import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * SurveyEvaluation Model - Represents a survey evaluation document in the 'survey_evaluations' Firestore collection
 * 
 * Collection: survey_evaluations
 * Document ID: Auto-generated
 * 
 * This model represents survey evaluations/ratings given by users for nominated collaborators in voting events.
 */

export interface SurveyEvaluation extends DocumentData {
  /** Unique identifier for the survey evaluation */
  id: string;
  
  /** ID of the voting event this evaluation belongs to */
  eventId: string;
  
  /** ID of the user who gave the evaluation */
  evaluatorId: string;
  
  /** ID of the collaborator being evaluated */
  evaluatedUserId: string;
  
  /** Array of scores for each survey question (1-10 scale) */
  scores: number[];
  
  /** When the evaluation was submitted */
  evaluationDate: Timestamp;
  
  /** Department of the evaluator (for analytics) */
  evaluatorDepartment?: string;
  
  /** Department of the evaluated user (for analytics) */
  evaluatedUserDepartment?: string;
  
  /** Whether this evaluation is valid/active */
  isValid?: boolean;
  
  /** Optional comments or feedback */
  comments?: string;
  
  /** Optional metadata about the evaluation */
  metadata?: {
    /** IP address from where the evaluation was submitted */
    ipAddress?: string;
    /** User agent of the browser */
    userAgent?: string;
    /** Any additional tracking info */
    [key: string]: any;
  };
  
  /** Timestamp when the evaluation was created */
  createdAt?: Timestamp;
  
  /** Timestamp when the evaluation was last updated */
  updatedAt?: Timestamp;
}

/**
 * Firestore document converter for SurveyEvaluation
 */
export const surveyEvaluationConverter = {
  toFirestore: (evaluation: SurveyEvaluation): DocumentData => {
    const { id, ...evaluationData } = evaluation;
    return {
      ...evaluationData,
      updatedAt: Timestamp.now()
    };
  },
  
  fromFirestore: (snapshot: any, options: any): SurveyEvaluation => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as SurveyEvaluation;
  }
};

/**
 * Default survey evaluation data for development/testing
 */
export const createDefaultSurveyEvaluation = (overrides: Partial<SurveyEvaluation> = {}): Omit<SurveyEvaluation, 'id'> => ({
  eventId: '',
  evaluatorId: '',
  evaluatedUserId: '',
  scores: [],
  evaluationDate: Timestamp.now(),
  isValid: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides
});
