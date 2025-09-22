import { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * AuditLog Model - Represents an audit log document in the 'audit_logs' Firestore collection
 * 
 * Collection: audit_logs
 * Document ID: Auto-generated
 * 
 * This model represents audit trail entries for tracking user actions and system events.
 */

export type AuditAction = 
  | 'Inicio de Sesión' 
  | 'Cierre de Sesión'
  | 'Nominar Colaborador'
  | 'Votar'
  | 'Crear Evento'
  | 'Editar Evento'
  | 'Eliminar Evento'
  | 'Crear Usuario'
  | 'Editar Usuario'
  | 'Eliminar Usuario'
  | 'Crear Departamento'
  | 'Editar Departamento'
  | 'Eliminar Departamento'
  | 'Completar Encuesta'
  | 'Ver Resultados'
  | 'Exportar Datos'
  | 'Cambiar Configuración'
  | 'Deshacer Acción'
  | string; // Allow custom actions

export interface AuditLog extends DocumentData {
  /** Unique identifier for the audit log entry */
  id: string;
  
  /** ID of the user who performed the action */
  userId: string;
  
  /** Name of the user (for easier querying) */
  userName?: string;
  
  /** The action that was performed */
  action: AuditAction;
  
  /** When the action occurred */
  timestamp: Timestamp;
  
  /** Additional details about the action */
  details: Record<string, any>;
  
  /** IP address from where the action was performed */
  ipAddress?: string;
  
  /** User agent of the browser */
  userAgent?: string;
  
  /** Resource that was affected (e.g., eventId, userId, etc.) */
  resourceId?: string;
  
  /** Type of resource that was affected */
  resourceType?: 'user' | 'event' | 'nomination' | 'vote' | 'system' | string;
  
  /** Severity level of the action */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  
  /** Whether this action was successful */
  success?: boolean;
  
  /** Error message if the action failed */
  errorMessage?: string;
  
  /** Session ID for grouping related actions */
  sessionId?: string;
  
  /** Previous state of the document before the change (for undo functionality) */
  oldState?: Record<string, any>;
  
  /** New state of the document after the change */
  newState?: Record<string, any>;
  
  /** Whether this action can be undone */
  canUndo?: boolean;
  
  /** Whether this action has been undone */
  isUndone?: boolean;
  
  /** ID of the audit log entry that undid this action */
  undoneByLogId?: string;
  
  /** Timestamp when the log entry was created */
  createdAt?: Timestamp;
}

/**
 * Firestore document converter for AuditLog
 */
export const auditLogConverter = {
  toFirestore: (log: AuditLog): DocumentData => {
    const { id, ...logData } = log;
    return logData;
  },
  
  fromFirestore: (snapshot: any, options: any): AuditLog => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as AuditLog;
  }
};

/**
 * Default audit log data for development/testing
 */
export const createDefaultAuditLog = (overrides: Partial<AuditLog> = {}): Omit<AuditLog, 'id'> => ({
  userId: '',
  action: 'Inicio de Sesión',
  timestamp: Timestamp.now(),
  details: {},
  severity: 'low',
  success: true,
  createdAt: Timestamp.now(),
  ...overrides
});

/**
 * Helper function to create audit log entries
 */
export const createAuditLogEntry = (
  userId: string,
  userName: string,
  action: AuditAction,
  details: Record<string, any> = {},
  options: {
    resourceId?: string;
    resourceType?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    success?: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    oldState?: Record<string, any>;
    newState?: Record<string, any>;
    canUndo?: boolean;
  } = {}
): Omit<AuditLog, 'id'> => ({
  userId,
  userName,
  action,
  timestamp: Timestamp.now(),
  details,
  severity: options.severity || 'low',
  success: options.success !== false,
  createdAt: Timestamp.now(),
  ...options
});
