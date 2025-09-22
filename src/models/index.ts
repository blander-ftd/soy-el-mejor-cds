/**
 * Firebase Models Index
 * 
 * This file exports all Firebase collection models and their related types.
 * Each model represents the structure of documents in Firestore collections.
 */

// User Model
export type { User, UserRole, UserDepartment } from './User';
export { userConverter, createDefaultUser } from './User';

// VotingEvent Model
export type { VotingEvent, VotingEventStatus, EventDepartment, SurveyQuestion } from './VotingEvent';
export { votingEventConverter, createDefaultVotingEvent } from './VotingEvent';

// Nomination Model
export type { Nomination } from './Nomination';
export { nominationConverter, createDefaultNomination } from './Nomination';

// Vote Model
export type { Vote } from './Vote';
export { voteConverter, createDefaultVote } from './Vote';

// AuditLog Model
export type { AuditLog, AuditAction } from './AuditLog';
export { auditLogConverter, createDefaultAuditLog, createAuditLogEntry } from './AuditLog';

// Department Model
export type { Department, DepartmentName } from './Department';
export { departmentConverter, createDefaultDepartment, PREDEFINED_DEPARTMENTS } from './Department';

// SurveyEvaluation Model
export type { SurveyEvaluation } from './SurveyEvaluation';
export { surveyEvaluationConverter, createDefaultSurveyEvaluation } from './SurveyEvaluation';

/**
 * Collection Names
 * Centralized collection names for consistency across the app
 */
export const COLLECTIONS = {
  USERS: 'users',
  VOTING_EVENTS: 'voting_events',
  NOMINATIONS: 'nominations',
  VOTES: 'votes',
  AUDIT_LOGS: 'audit_logs',
  DEPARTMENTS: 'departments',
  SURVEY_EVALUATIONS: 'survey_evaluations'
} as const;

/**
 * Type for collection names
 */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
