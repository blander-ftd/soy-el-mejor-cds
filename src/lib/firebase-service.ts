import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { 
  User, 
  VotingEvent, 
  VotingEventStatus,
  AuditLog, 
  Nomination, 
  Vote, 
  Department,
  SurveyEvaluation,
  COLLECTIONS,
  userConverter,
  votingEventConverter,
  auditLogConverter,
  nominationConverter,
  voteConverter,
  departmentConverter,
  surveyEvaluationConverter,
  createAuditLogEntry
} from '@/models';

/**
 * Firebase Service Functions
 * Centralized functions for Firebase Firestore operations
 */

// ==================== USERS ====================

export const userService = {
  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.USERS).withConverter(userConverter), orderBy('name'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, COLLECTIONS.USERS, id).withConverter(userConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  async create(userData: Omit<User, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.USERS).withConverter(userConverter),
      {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      } as User
    );
    return docRef.id;
  },

  async createWithAuth(userData: Omit<User, 'id'>): Promise<{ userId: string; tempPassword: string }> {
    const createUserWithAuth = httpsCallable(functions, 'createUserWithAuth');
    
    try {
      // Clean data to remove undefined values
      const cleanUserData: any = {
        name: userData.name,
        email: userData.email,
        role: userData.role
      };

      if (userData.department) {
        cleanUserData.department = userData.department;
      }

      if (userData.cedula) {
        cleanUserData.cedula = userData.cedula;
      }

      console.log('Calling createUserWithAuth with data:', cleanUserData);

      const result = await createUserWithAuth(cleanUserData);

      console.log('Function result:', result);
      const data = result.data as any;
      
      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to create user with auth');
      }

      return {
        userId: data.userId,
        tempPassword: data.tempPassword
      };
    } catch (error: any) {
      console.error('Error calling createUserWithAuth function:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        data: error.data
      });
      
      // If the function returned an error with a message, use that
      if (error.details?.message) {
        throw new Error(error.details.message);
      }
      
      // Handle specific Firebase Function errors
      if (error.code === 'functions/not-found') {
        throw new Error('La función de creación de usuarios no está disponible. Contacta al administrador del sistema.');
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error('No tienes permisos para crear usuarios. Inicia sesión como administrador.');
      } else if (error.code === 'functions/permission-denied') {
        throw new Error('No tienes permisos de administrador para crear usuarios.');
      }
      
      throw new Error(error.message || 'Error interno del servidor. Intenta de nuevo más tarde.');
    }
  },

  async update(id: string, userData: Partial<User>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, id).withConverter(userConverter);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    await deleteDoc(docRef);
  },

  async getByDepartment(department: string): Promise<User[]> {
    const q = query(
      collection(db, COLLECTIONS.USERS).withConverter(userConverter),
      where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => doc.data());
    
    // Sort client-side to avoid composite index requirement
    return users.sort((a, b) => a.name.localeCompare(b.name));
  }
};

// ==================== VOTING EVENTS ====================

export const votingEventService = {
  async getAll(): Promise<VotingEvent[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.VOTING_EVENTS).withConverter(votingEventConverter), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async getById(id: string): Promise<VotingEvent | null> {
    const docRef = doc(db, COLLECTIONS.VOTING_EVENTS, id).withConverter(votingEventConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  async create(eventData: Omit<VotingEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.VOTING_EVENTS).withConverter(votingEventConverter),
      {
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as VotingEvent
    );
    return docRef.id;
  },

  async update(id: string, eventData: Partial<VotingEvent>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.VOTING_EVENTS, id).withConverter(votingEventConverter);
    await updateDoc(docRef, {
      ...eventData,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.VOTING_EVENTS, id);
    await deleteDoc(docRef);
  },

  async getActive(): Promise<VotingEvent[]> {
    const q = query(
      collection(db, COLLECTIONS.VOTING_EVENTS).withConverter(votingEventConverter),
      where('status', '==', 'Active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  },

  /**
   * Gets active events and automatically updates their statuses based on dates
   */
  async getActiveWithStatusUpdate(): Promise<VotingEvent[]> {
    // First update all event statuses
    await this.updateAllEventStatusesByDate();
    
    // Then get the currently active events
    return await this.getActive();
  },

  /**
   * Updates event status based on current date and event dates
   */
  async updateEventStatusByDate(event: VotingEvent): Promise<VotingEvent> {
    const now = new Date();
    let newStatus: VotingEventStatus = event.status;

    // Convert Firestore Timestamps to Dates for comparison
    const startDate = event.startDate?.toDate();
    const endDate = event.endDate?.toDate();
    const evaluationEndDate = event.evaluationEndDate?.toDate();

    // Determine status based on dates
    if (evaluationEndDate && now > evaluationEndDate) {
      // Event is completely finished (past evaluation end date)
      newStatus = 'Closed';
    } else if (endDate && now > endDate) {
      // Event voting period is over, but evaluation might still be ongoing
      newStatus = 'Closed';
    } else if (startDate && now >= startDate) {
      // Event has started
      newStatus = 'Active';
    } else {
      // Event hasn't started yet
      newStatus = 'Pending';
    }

    // Update status if it has changed
    if (newStatus !== event.status) {
      await this.update(event.id, { status: newStatus });
      return { ...event, status: newStatus };
    }

    return event;
  },

  /**
   * Updates all events' statuses based on current date
   */
  async updateAllEventStatusesByDate(): Promise<VotingEvent[]> {
    const allEvents = await this.getAll();
    const updatedEvents: VotingEvent[] = [];

    for (const event of allEvents) {
      const updatedEvent = await this.updateEventStatusByDate(event);
      updatedEvents.push(updatedEvent);
    }

    return updatedEvents;
  },

  /**
   * Gets all events and automatically updates their statuses based on dates
   */
  async getAllWithStatusUpdate(): Promise<VotingEvent[]> {
    return await this.updateAllEventStatusesByDate();
  }
};

// ==================== AUDIT LOGS ====================

export const auditLogService = {
  async getAll(limitCount: number = 100): Promise<AuditLog[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.AUDIT_LOGS).withConverter(auditLogConverter), 
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async create(logData: Omit<AuditLog, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.AUDIT_LOGS).withConverter(auditLogConverter),
      {
        ...logData,
        createdAt: Timestamp.now()
      } as AuditLog
    );
    return docRef.id;
  },

  async logAction(
    userId: string, 
    userName: string, 
    action: string, 
    details: Record<string, any> = {},
    options: {
      resourceId?: string;
      resourceType?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      success?: boolean;
      errorMessage?: string;
      oldState?: Record<string, any>;
      newState?: Record<string, any>;
      canUndo?: boolean;
    } = {}
  ): Promise<string> {
    const logEntry = createAuditLogEntry(userId, userName, action, details, options);
    return await this.create(logEntry);
  },

  async getByUser(userId: string, limitCount: number = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS).withConverter(auditLogConverter),
      where('userId', '==', userId),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => doc.data());
    
    // Sort client-side to avoid composite index requirement
    return logs.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  },

  async getById(id: string): Promise<AuditLog | null> {
    const docRef = doc(db, COLLECTIONS.AUDIT_LOGS, id).withConverter(auditLogConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  async update(id: string, logData: Partial<AuditLog>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.AUDIT_LOGS, id).withConverter(auditLogConverter);
    await updateDoc(docRef, logData);
  },

  async getFilteredLogs(filters: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    resourceType?: string;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    let q = collection(db, COLLECTIONS.AUDIT_LOGS).withConverter(auditLogConverter);
    const constraints = [];

    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters.severity) {
      constraints.push(where('severity', '==', filters.severity));
    }
    if (filters.resourceType) {
      constraints.push(where('resourceType', '==', filters.resourceType));
    }
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    constraints.push(limit(filters.limit || 100));

    const querySnapshot = await getDocs(query(q, ...constraints));
    const logs = querySnapshot.docs.map(doc => doc.data());
    
    // Sort client-side to avoid composite index requirement
    return logs.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
  },

  async undoAction(
    auditLogId: string, 
    currentUserId: string, 
    currentUserName: string
  ): Promise<boolean> {
    try {
      const auditLog = await this.getById(auditLogId);
      if (!auditLog || !auditLog.canUndo || auditLog.isUndone || !auditLog.oldState) {
        return false;
      }

      // Restore the old state based on resource type
      if (auditLog.resourceType && auditLog.resourceId && auditLog.oldState) {
        switch (auditLog.resourceType) {
          case 'user':
            await userService.update(auditLog.resourceId, auditLog.oldState);
            break;
          case 'event':
            await votingEventService.update(auditLog.resourceId, auditLog.oldState);
            break;
          case 'department':
            await departmentService.update(auditLog.resourceId, auditLog.oldState);
            break;
          default:
            return false;
        }

        // Mark the original action as undone
        await this.update(auditLogId, { 
          isUndone: true,
          undoneByLogId: auditLogId // Will be updated with the actual undo log ID
        });

        // Create an undo audit log
        const undoLogId = await this.logAction(
          currentUserId,
          currentUserName,
          'Deshacer Acción',
          {
            originalAction: auditLog.action,
            originalLogId: auditLogId,
            restoredState: auditLog.oldState
          },
          {
            resourceId: auditLog.resourceId,
            resourceType: auditLog.resourceType,
            severity: 'medium',
            success: true
          }
        );

        // Update the original log with the undo log ID
        await this.update(auditLogId, { undoneByLogId: undoLogId });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error undoing action:', error);
      return false;
    }
  }
};

// ==================== NOMINATIONS ====================

export const nominationService = {
  async getAll(): Promise<Nomination[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.NOMINATIONS).withConverter(nominationConverter), orderBy('nominationDate', 'desc'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async create(nominationData: Omit<Nomination, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.NOMINATIONS).withConverter(nominationConverter),
      {
        ...nominationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      } as Nomination
    );
    return docRef.id;
  },

  async getByEvent(eventId: string): Promise<Nomination[]> {
    const q = query(
      collection(db, COLLECTIONS.NOMINATIONS).withConverter(nominationConverter),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
};

// ==================== VOTES ====================

export const voteService = {
  async getAll(): Promise<Vote[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.VOTES).withConverter(voteConverter), orderBy('voteDate', 'desc'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async create(voteData: Omit<Vote, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.VOTES).withConverter(voteConverter),
      {
        ...voteData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isValid: true
      } as Vote
    );
    return docRef.id;
  },

  async getByEvent(eventId: string): Promise<Vote[]> {
    const q = query(
      collection(db, COLLECTIONS.VOTES).withConverter(voteConverter),
      where('eventId', '==', eventId),
      where('isValid', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
};

// ==================== DEPARTMENTS ====================

export const departmentService = {
  async getAll(): Promise<Department[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.DEPARTMENTS).withConverter(departmentConverter), orderBy('name'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async getById(id: string): Promise<Department | null> {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id).withConverter(departmentConverter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  async create(departmentData: Omit<Department, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.DEPARTMENTS).withConverter(departmentConverter),
      {
        ...departmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Department
    );
    return docRef.id;
  },

  async update(id: string, departmentData: Partial<Department>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id).withConverter(departmentConverter);
    await updateDoc(docRef, {
      ...departmentData,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id);
    await deleteDoc(docRef);
  },

  async getActiveOnly(): Promise<Department[]> {
    // Fetch all departments and filter/sort client-side to avoid composite index requirement
    const querySnapshot = await getDocs(
      collection(db, COLLECTIONS.DEPARTMENTS).withConverter(departmentConverter)
    );
    const allDepartments = querySnapshot.docs.map(doc => doc.data());
    
    // Filter active departments and sort by name
    return allDepartments
      .filter(dept => dept.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
};

// ==================== SURVEY EVALUATIONS ====================

export const surveyEvaluationService = {
  async getAll(): Promise<SurveyEvaluation[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.SURVEY_EVALUATIONS).withConverter(surveyEvaluationConverter), orderBy('evaluationDate', 'desc'))
    );
    return querySnapshot.docs.map(doc => doc.data());
  },

  async create(evaluationData: Omit<SurveyEvaluation, 'id'>): Promise<string> {
    const docRef = await addDoc(
      collection(db, COLLECTIONS.SURVEY_EVALUATIONS).withConverter(surveyEvaluationConverter),
      {
        ...evaluationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isValid: true
      } as SurveyEvaluation
    );
    return docRef.id;
  },

  async getByEvent(eventId: string): Promise<SurveyEvaluation[]> {
    const q = query(
      collection(db, COLLECTIONS.SURVEY_EVALUATIONS).withConverter(surveyEvaluationConverter),
      where('eventId', '==', eventId),
      where('isValid', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  },

  async getByEvaluatedUser(eventId: string, evaluatedUserId: string): Promise<SurveyEvaluation[]> {
    const q = query(
      collection(db, COLLECTIONS.SURVEY_EVALUATIONS).withConverter(surveyEvaluationConverter),
      where('eventId', '==', eventId),
      where('evaluatedUserId', '==', evaluatedUserId),
      where('isValid', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
};

// ==================== BATCH OPERATIONS ====================

export const batchService = {
  async uploadTestData(testData: {
    users: Omit<User, 'id'>[];
    votingEvents: Omit<VotingEvent, 'id'>[];
    auditLogs: Omit<AuditLog, 'id'>[];
    departments: Omit<Department, 'id'>[];
    surveyEvaluations?: Omit<SurveyEvaluation, 'id'>[];
  }): Promise<void> {
    const batch = writeBatch(db);

    // Helper function to remove undefined values
    const cleanData = (obj: any) => {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          cleaned[key] = obj[key];
        }
      });
      return cleaned;
    };

    // Add users
    testData.users.forEach(userData => {
      const userRef = doc(collection(db, COLLECTIONS.USERS));
      batch.set(userRef, cleanData({
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      }));
    });

    // Add voting events
    testData.votingEvents.forEach(eventData => {
      const eventRef = doc(collection(db, COLLECTIONS.VOTING_EVENTS));
      batch.set(eventRef, cleanData({
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }));
    });

    // Add audit logs
    testData.auditLogs.forEach(logData => {
      const logRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      batch.set(logRef, cleanData({
        ...logData,
        createdAt: Timestamp.now()
      }));
    });

    // Add departments
    testData.departments.forEach(deptData => {
      const deptRef = doc(collection(db, COLLECTIONS.DEPARTMENTS));
      batch.set(deptRef, cleanData({
        ...deptData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }));
    });

    // Add survey evaluations (if provided)
    if (testData.surveyEvaluations) {
      testData.surveyEvaluations.forEach(evalData => {
        const evalRef = doc(collection(db, COLLECTIONS.SURVEY_EVALUATIONS));
        batch.set(evalRef, cleanData({
          ...evalData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isValid: true
        }));
      });
    }

    await batch.commit();
  },

  /**
   * Deletes all test data from all Firebase collections
   * WARNING: This will delete ALL data in the database!
   */
  async deleteAllTestData(): Promise<void> {
    console.log('🗑️ Starting deletion of all test data...');

    // Get all collections
    const collections = [
      COLLECTIONS.USERS,
      COLLECTIONS.VOTING_EVENTS,
      COLLECTIONS.NOMINATIONS,
      COLLECTIONS.VOTES,
      COLLECTIONS.SURVEY_EVALUATIONS,
      COLLECTIONS.DEPARTMENTS,
      COLLECTIONS.AUDIT_LOGS
    ];

    let totalDeleted = 0;

    for (const collectionName of collections) {
      console.log(`🗑️ Deleting documents from ${collectionName}...`);
      
      // Get all documents in the collection
      const querySnapshot = await getDocs(collection(db, collectionName));
      const docs = querySnapshot.docs;
      
      if (docs.length === 0) {
        console.log(`✅ ${collectionName}: No documents to delete`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedInCollection = 0;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);

        batchDocs.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        deletedInCollection += batchDocs.length;
        totalDeleted += batchDocs.length;
      }

      console.log(`✅ ${collectionName}: Deleted ${deletedInCollection} documents`);
    }

    console.log(`🎉 Successfully deleted ${totalDeleted} documents from all collections!`);
  },

  /**
   * Deletes all data and uploads fresh test data
   */
  async resetWithTestData(testData: {
    users: Omit<User, 'id'>[];
    votingEvents: Omit<VotingEvent, 'id'>[];
    auditLogs: Omit<AuditLog, 'id'>[];
    departments: Omit<Department, 'id'>[];
    surveyEvaluations?: Omit<SurveyEvaluation, 'id'>[];
  }): Promise<void> {
    console.log('🔄 Resetting database with fresh test data...');
    
    // First delete all existing data
    await this.deleteAllTestData();
    
    // Then upload new test data
    await this.uploadTestData(testData);
    
    console.log('✅ Database reset complete!');
  }
};
