import { Timestamp } from 'firebase/firestore';
import { batchService } from './firebase-service';
import { users, votingEvents, auditLogs } from './data';
import { PREDEFINED_DEPARTMENTS } from '@/models';

/**
 * Upload Test Data to Firebase
 * This script converts the local test data to Firebase format and uploads it
 */

// Convert local users to Firebase format
const convertUsersToFirebase = () => {
  return users.map(user => ({
    name: user.name,
    email: user.email,
    cedula: user.cedula,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }));
};

// Convert local voting events to Firebase format
const convertVotingEventsToFirebase = () => {
  return votingEvents.map(event => {
    const firebaseEvent: any = {
      month: event.month,
      department: "All Departments", // Updated to match current schema
      status: event.status,
      surveyQuestions: event.surveyQuestions || [
        { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
        { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
        { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
        { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
        { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Only add date fields if they exist (Firebase doesn't allow undefined)
    if (event.startDate) {
      firebaseEvent.startDate = Timestamp.fromDate(event.startDate);
    }
    if (event.endDate) {
      firebaseEvent.endDate = Timestamp.fromDate(event.endDate);
      // Set additional dates based on the end date for proper event phases
      const endDate = new Date(event.endDate);
      const startDate = new Date(event.startDate || endDate);
      
      // Calculate phase dates (nomination: first 1/3, voting: middle 1/3, evaluation: last 1/3)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const phaseLength = Math.ceil(totalDays / 3);
      
      const nominationEnd = new Date(startDate.getTime() + (phaseLength * 24 * 60 * 60 * 1000));
      const votingEnd = new Date(startDate.getTime() + (phaseLength * 2 * 24 * 60 * 60 * 1000));
      
      firebaseEvent.nominationEndDate = Timestamp.fromDate(nominationEnd);
      firebaseEvent.votingEndDate = Timestamp.fromDate(votingEnd);
      firebaseEvent.evaluationEndDate = Timestamp.fromDate(endDate);
    }

    return firebaseEvent;
  });
};

// Convert local audit logs to Firebase format
const convertAuditLogsToFirebase = () => {
  return auditLogs.map(log => ({
    userId: log.userId,
    userName: users.find(u => u.id === log.userId)?.name || 'Usuario Desconocido',
    action: log.action,
    timestamp: Timestamp.fromDate(log.timestamp),
    details: log.details,
    severity: 'low' as const,
    success: true,
    resourceType: 'system' as const,
    canUndo: false,
    isUndone: false,
    createdAt: Timestamp.now()
  }));
};

// Convert departments to Firebase format with enhanced data
const convertDepartmentsToFirebase = () => {
  const enhancedDepartments = [
    {
      name: 'Technology',
      displayName: 'Tecnología',
      description: 'Departamento de desarrollo de software y tecnología',
      supervisorIds: ['user-2'], // Sofia Davis
      coordinatorIds: ['user-4'], // Maria Garcia
      collaboratorIds: ['user-3', 'user-7', 'user-8', 'user-9', 'user-10', 'user-11', 'user-12'],
      winnersQuantity: 2,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      name: 'Marketing',
      displayName: 'Marketing',
      description: 'Departamento de marketing y comunicaciones',
      supervisorIds: ['user-5'], // David Smith
      coordinatorIds: ['user-21'], // Joseph Lewis
      collaboratorIds: ['user-6', 'user-13', 'user-14'],
      winnersQuantity: 1,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      name: 'Sales',
      displayName: 'Ventas',
      description: 'Departamento de ventas y desarrollo comercial',
      supervisorIds: ['user-15'], // Robert Hall
      coordinatorIds: ['user-22'], // Susan Walker
      collaboratorIds: ['user-16', 'user-17', 'user-24'],
      winnersQuantity: 1,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      name: 'Human Resources',
      displayName: 'Recursos Humanos',
      description: 'Departamento de recursos humanos y gestión de personal',
      supervisorIds: ['user-18'], // Barbara Carter
      coordinatorIds: ['user-23'], // Thomas Robinson
      collaboratorIds: ['user-19', 'user-20'],
      winnersQuantity: 1,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  return enhancedDepartments;
};

// Additional test data
const createAdditionalTestData = () => {
  const additionalUsers = [
    {
      name: 'Ana Rodriguez',
      email: 'ana.rodriguez@company.com',
      cedula: '30303030',
      role: 'Supervisor' as const,
      department: 'Human Resources' as const,
      avatar: 'https://picsum.photos/id/25/100',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      name: 'Carlos Mendez',
      email: 'carlos.mendez@company.com',
      cedula: '31313131',
      role: 'Coordinator' as const,
      department: 'Sales' as const,
      avatar: 'https://picsum.photos/id/26/100',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  const additionalEvents = [
    {
      month: 'Septiembre 2024',
      department: 'All Departments' as const,
      status: 'Active' as const,
      startDate: Timestamp.fromDate(new Date('2024-09-01')),
      endDate: Timestamp.fromDate(new Date('2024-09-30')),
      nominationEndDate: Timestamp.fromDate(new Date('2024-09-10')),
      votingEndDate: Timestamp.fromDate(new Date('2024-09-20')),
      evaluationEndDate: Timestamp.fromDate(new Date('2024-09-30')),
      surveyQuestions: [
        { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
        { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
        { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
        { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
        { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
      ],
      createdBy: 'user-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      month: 'Octubre 2024',
      department: 'All Departments' as const,
      status: 'Pending' as const,
      startDate: Timestamp.fromDate(new Date('2024-10-01')),
      endDate: Timestamp.fromDate(new Date('2024-10-31')),
      nominationEndDate: Timestamp.fromDate(new Date('2024-10-10')),
      votingEndDate: Timestamp.fromDate(new Date('2024-10-20')),
      evaluationEndDate: Timestamp.fromDate(new Date('2024-10-31')),
      surveyQuestions: [
        { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
        { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
        { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
        { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
        { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
      ],
      createdBy: 'user-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      month: 'Noviembre 2024',
      department: 'All Departments' as const,
      status: 'Closed' as const,
      startDate: Timestamp.fromDate(new Date('2024-11-01')),
      endDate: Timestamp.fromDate(new Date('2024-11-30')),
      nominationEndDate: Timestamp.fromDate(new Date('2024-11-10')),
      votingEndDate: Timestamp.fromDate(new Date('2024-11-20')),
      evaluationEndDate: Timestamp.fromDate(new Date('2024-11-30')),
      winnerMessage: 'Felicitaciones a todos los ganadores del mes de Noviembre 2024!',
      surveyQuestions: [
        { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
        { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
        { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
        { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
        { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
      ],
      createdBy: 'user-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  const additionalAuditLogs = [
    {
      userId: 'user-1',
      userName: 'Usuario Admin',
      action: 'Crear Evento',
      timestamp: Timestamp.now(),
      details: { eventName: 'Septiembre 2024', department: 'Technology' },
      severity: 'medium' as const,
      success: true,
      resourceType: 'event' as const,
      resourceId: 'event-sep-2024',
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.now()
    },
    {
      userId: 'user-1',
      userName: 'Usuario Admin',
      action: 'Crear Usuario',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
      details: { 
        userName: 'Test User',
        userEmail: 'test@example.com',
        userRole: 'Collaborator',
        userDepartment: 'Technology'
      },
      severity: 'medium' as const,
      success: true,
      resourceType: 'user' as const,
      resourceId: 'user-test-123',
      oldState: null,
      newState: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'Collaborator',
        department: 'Technology',
        isActive: true
      },
      canUndo: true,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
    },
    {
      userId: 'user-1',
      userName: 'Usuario Admin',
      action: 'Editar Departamento',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
      details: { 
        departmentId: 'dept-tech-001',
        departmentName: 'Technology',
        changes: ['supervisorIds', 'winnersQuantity']
      },
      severity: 'medium' as const,
      success: true,
      resourceType: 'department' as const,
      resourceId: 'dept-tech-001',
      oldState: {
        name: 'Technology',
        displayName: 'Tecnología',
        supervisorIds: ['user-2'],
        coordinatorIds: ['user-4'],
        winnersQuantity: 1,
        isActive: true
      },
      newState: {
        name: 'Technology',
        displayName: 'Tecnología',
        supervisorIds: ['user-2', 'user-5'],
        coordinatorIds: ['user-4'],
        winnersQuantity: 2,
        isActive: true
      },
      canUndo: true,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
    },
    {
      userId: 'user-2',
      userName: 'Sofia Davis',
      action: 'Nominar Colaborador',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1800000)), // 30 minutes ago
      details: { collaboratorId: 'user-3', eventId: 'event-1' },
      severity: 'low' as const,
      success: true,
      resourceType: 'nomination' as const,
      resourceId: 'nom-001',
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 1800000))
    },
    {
      userId: 'user-3',
      userName: 'Alex Johnson',
      action: 'Votar',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 900000)), // 15 minutes ago
      details: { eventId: 'event-1', votedFor: ['user-7', 'user-8'] },
      severity: 'low' as const,
      success: true,
      resourceType: 'vote' as const,
      resourceId: 'vote-001',
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 900000))
    },
    {
      userId: 'user-1',
      userName: 'Usuario Admin',
      action: 'Deshacer Acción',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 300000)), // 5 minutes ago
      details: { 
        originalAction: 'Editar Usuario',
        originalLogId: 'log-edit-user-001',
        restoredState: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Collaborator',
          department: 'Marketing'
        }
      },
      severity: 'high' as const,
      success: true,
      resourceType: 'user' as const,
      resourceId: 'user-john-doe',
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 300000))
    },
    {
      userId: 'user-2',
      userName: 'Sofia Davis',
      action: 'Inicio de Sesión',
      timestamp: Timestamp.now(),
      details: { 
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      severity: 'low' as const,
      success: true,
      resourceType: 'system' as const,
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.now()
    },
    {
      userId: 'user-5',
      userName: 'David Smith',
      action: 'Exportar Datos',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
      details: { 
        exportType: 'voting_results',
        eventId: 'event-1',
        format: 'CSV'
      },
      severity: 'medium' as const,
      success: true,
      resourceType: 'system' as const,
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
    },
    {
      userId: 'user-1',
      userName: 'Usuario Admin',
      action: 'Cambiar Configuración',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 10800000)), // 3 hours ago
      details: { 
        setting: 'max_nominations_per_user',
        oldValue: 3,
        newValue: 5
      },
      severity: 'high' as const,
      success: false,
      errorMessage: 'Valor fuera del rango permitido',
      resourceType: 'system' as const,
      canUndo: false,
      isUndone: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 10800000))
    }
  ];

  return {
    users: additionalUsers,
    events: additionalEvents,
    auditLogs: additionalAuditLogs
  };
};

/**
 * Main function to upload all test data
 */
export const uploadTestData = async (): Promise<void> => {
  try {
    console.log('🚀 Starting test data upload...');

    const baseUsers = convertUsersToFirebase();
    const baseEvents = convertVotingEventsToFirebase();
    const baseAuditLogs = convertAuditLogsToFirebase();
    const departments = convertDepartmentsToFirebase();

    const additionalData = createAdditionalTestData();

    const testData = {
      users: [...baseUsers, ...additionalData.users],
      votingEvents: [...baseEvents, ...additionalData.events],
      auditLogs: [...baseAuditLogs, ...additionalData.auditLogs],
      departments
    };

    await batchService.uploadTestData(testData);

    console.log('✅ Test data uploaded successfully!');
    console.log(`📊 Uploaded:
    - ${testData.users.length} users
    - ${testData.votingEvents.length} voting events  
    - ${testData.auditLogs.length} audit logs (with undo functionality)
    - ${testData.departments.length} departments (with supervisors, coordinators, and winners quantity)`);
    
    console.log(`\n🔍 Enhanced Features:
    - Audit logs include oldState/newState for undo functionality
    - Departments have proper supervisor/coordinator assignments
    - Multiple audit log types with different severities and timestamps
    - Some audit logs are marked as undoable for testing`);

  } catch (error) {
    console.error('❌ Error uploading test data:', error);
    throw error;
  }
};

/**
 * Helper function to check if we're in development mode
 */
export const canUploadTestData = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
