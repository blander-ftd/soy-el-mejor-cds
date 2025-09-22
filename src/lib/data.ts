import type { User, Department, Role, VotingEvent, Nomination, Vote, AuditLog, NominatedEntry } from './types';

export const departments: Department[] = ["Transporte", "Gestion de Inventario", "Recursos Humanos"];

export const users: User[] = [
  // Admin User
  { id: 'admin-1', name: 'Carlos Administrador', email: 'admin@soyelmejor.com', cedula: '10000001', role: 'Admin', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/1/100' },
  
  // Departamento de Transporte
  { id: 'trans-sup-1', name: 'Ana Rodriguez', email: 'ana.rodriguez@soyelmejor.com', cedula: '20001001', role: 'Supervisor', department: 'Transporte', avatar: 'https://picsum.photos/id/2/100' },
  { id: 'trans-coord-1', name: 'Miguel Santos', email: 'miguel.santos@soyelmejor.com', cedula: '20001002', role: 'Coordinator', department: 'Transporte', avatar: 'https://picsum.photos/id/3/100' },
  { id: 'trans-col-1', name: 'Luis Fernandez', email: 'luis.fernandez@soyelmejor.com', cedula: '20001003', role: 'Collaborator', department: 'Transporte', avatar: 'https://picsum.photos/id/4/100' },
  { id: 'trans-col-2', name: 'Carmen Jimenez', email: 'carmen.jimenez@soyelmejor.com', cedula: '20001004', role: 'Collaborator', department: 'Transporte', avatar: 'https://picsum.photos/id/5/100' },
  { id: 'trans-col-3', name: 'Roberto Morales', email: 'roberto.morales@soyelmejor.com', cedula: '20001005', role: 'Collaborator', department: 'Transporte', avatar: 'https://picsum.photos/id/6/100' },
  { id: 'trans-col-4', name: 'Sofia Herrera', email: 'sofia.herrera@soyelmejor.com', cedula: '20001006', role: 'Collaborator', department: 'Transporte', avatar: 'https://picsum.photos/id/7/100' },
  { id: 'trans-col-5', name: 'Diego Vargas', email: 'diego.vargas@soyelmejor.com', cedula: '20001007', role: 'Collaborator', department: 'Transporte', avatar: 'https://picsum.photos/id/8/100' },

  // Departamento de Gestión de Inventario
  { id: 'inv-sup-1', name: 'Patricia Gonzalez', email: 'patricia.gonzalez@soyelmejor.com', cedula: '20002001', role: 'Supervisor', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/9/100' },
  { id: 'inv-coord-1', name: 'Fernando Castro', email: 'fernando.castro@soyelmejor.com', cedula: '20002002', role: 'Coordinator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/10/100' },
  { id: 'inv-col-1', name: 'Maria Lopez', email: 'maria.lopez@soyelmejor.com', cedula: '20002003', role: 'Collaborator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/11/100' },
  { id: 'inv-col-2', name: 'Andres Ruiz', email: 'andres.ruiz@soyelmejor.com', cedula: '20002004', role: 'Collaborator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/12/100' },
  { id: 'inv-col-3', name: 'Lucia Mendez', email: 'lucia.mendez@soyelmejor.com', cedula: '20002005', role: 'Collaborator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/13/100' },
  { id: 'inv-col-4', name: 'Javier Ortiz', email: 'javier.ortiz@soyelmejor.com', cedula: '20002006', role: 'Collaborator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/14/100' },
  { id: 'inv-col-5', name: 'Valentina Torres', email: 'valentina.torres@soyelmejor.com', cedula: '20002007', role: 'Collaborator', department: 'Gestion de Inventario', avatar: 'https://picsum.photos/id/15/100' },

  // Departamento de Recursos Humanos
  { id: 'rh-sup-1', name: 'Eduardo Martinez', email: 'eduardo.martinez@soyelmejor.com', cedula: '20003001', role: 'Supervisor', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/16/100' },
  { id: 'rh-coord-1', name: 'Gabriela Ramirez', email: 'gabriela.ramirez@soyelmejor.com', cedula: '20003002', role: 'Coordinator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/17/100' },
  { id: 'rh-col-1', name: 'Alejandro Silva', email: 'alejandro.silva@soyelmejor.com', cedula: '20003003', role: 'Collaborator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/18/100' },
  { id: 'rh-col-2', name: 'Isabella Flores', email: 'isabella.flores@soyelmejor.com', cedula: '20003004', role: 'Collaborator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/19/100' },
  { id: 'rh-col-3', name: 'Sebastian Diaz', email: 'sebastian.diaz@soyelmejor.com', cedula: '20003005', role: 'Collaborator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/20/100' },
  { id: 'rh-col-4', name: 'Camila Perez', email: 'camila.perez@soyelmejor.com', cedula: '20003006', role: 'Collaborator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/21/100' },
  { id: 'rh-col-5', name: 'Nicolas Gutierrez', email: 'nicolas.gutierrez@soyelmejor.com', cedula: '20003007', role: 'Collaborator', department: 'Recursos Humanos', avatar: 'https://picsum.photos/id/22/100' }
];

const defaultSurveyQuestions = [
    { title: 'Trabajo en Equipo', body: '¿Qué tan bien colabora esta persona con otros?' },
    { title: 'Innovación', body: '¿Aporta esta persona ideas nuevas y creativas a la mesa?' },
    { title: 'Liderazgo', body: '¿Demuestra esta persona cualidades de liderazgo, incluso sin un título formal?' },
    { title: 'Resolución de Problemas', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
    { title: 'Contribución General', body: '¿Cuál ha sido la contribución más significativa de esta persona este mes?' }
];

export const votingEvents: VotingEvent[] = [
    { 
        id: 'event-active-1', 
        department: 'All Departments', 
        status: 'Active', 
        month: 'Diciembre 2024', 
        startDate: new Date('2024-12-01'), 
        endDate: new Date('2024-12-21'), 
        surveyQuestions: defaultSurveyQuestions 
    },
    { 
        id: 'event-closed-1', 
        department: 'All Departments', 
        status: 'Closed', 
        month: 'Noviembre 2024', 
        startDate: new Date('2024-11-01'), 
        endDate: new Date('2024-11-21'), 
        surveyQuestions: defaultSurveyQuestions 
    }
];

export const nominations: Nomination[] = [
    // Nominations for Active Event (Diciembre 2024) - Currently in nomination phase
    { id: 'nom-active-1', eventId: 'event-active-1', collaboratorId: 'trans-col-1', nominatedById: 'trans-sup-1', nominationDate: new Date('2024-12-02') },
    { id: 'nom-active-2', eventId: 'event-active-1', collaboratorId: 'trans-col-2', nominatedById: 'trans-coord-1', nominationDate: new Date('2024-12-02') },
    { id: 'nom-active-3', eventId: 'event-active-1', collaboratorId: 'inv-col-1', nominatedById: 'inv-sup-1', nominationDate: new Date('2024-12-03') },
    { id: 'nom-active-4', eventId: 'event-active-1', collaboratorId: 'inv-col-3', nominatedById: 'inv-coord-1', nominationDate: new Date('2024-12-03') },
    { id: 'nom-active-5', eventId: 'event-active-1', collaboratorId: 'rh-col-1', nominatedById: 'rh-sup-1', nominationDate: new Date('2024-12-04') },
    { id: 'nom-active-6', eventId: 'event-active-1', collaboratorId: 'rh-col-2', nominatedById: 'rh-coord-1', nominationDate: new Date('2024-12-04') },
    
    // Nominations for Closed Event (Noviembre 2024) - Completed
    { id: 'nom-closed-1', eventId: 'event-closed-1', collaboratorId: 'trans-col-1', nominatedById: 'trans-sup-1', nominationDate: new Date('2024-11-02') },
    { id: 'nom-closed-2', eventId: 'event-closed-1', collaboratorId: 'trans-col-3', nominatedById: 'trans-coord-1', nominationDate: new Date('2024-11-02') },
    { id: 'nom-closed-3', eventId: 'event-closed-1', collaboratorId: 'trans-col-4', nominatedById: 'trans-col-2', nominationDate: new Date('2024-11-03') },
    { id: 'nom-closed-4', eventId: 'event-closed-1', collaboratorId: 'inv-col-1', nominatedById: 'inv-sup-1', nominationDate: new Date('2024-11-03') },
    { id: 'nom-closed-5', eventId: 'event-closed-1', collaboratorId: 'inv-col-2', nominatedById: 'inv-coord-1', nominationDate: new Date('2024-11-04') },
    { id: 'nom-closed-6', eventId: 'event-closed-1', collaboratorId: 'inv-col-5', nominatedById: 'inv-col-3', nominationDate: new Date('2024-11-04') },
    { id: 'nom-closed-7', eventId: 'event-closed-1', collaboratorId: 'rh-col-1', nominatedById: 'rh-sup-1', nominationDate: new Date('2024-11-05') },
    { id: 'nom-closed-8', eventId: 'event-closed-1', collaboratorId: 'rh-col-3', nominatedById: 'rh-coord-1', nominationDate: new Date('2024-11-05') },
    { id: 'nom-closed-9', eventId: 'event-closed-1', collaboratorId: 'rh-col-4', nominatedById: 'rh-col-2', nominationDate: new Date('2024-11-06') },
];

export const votes: Vote[] = [
    // Votes for Closed Event (Noviembre 2024) - Completed voting
    { id: 'vote-closed-1', eventId: 'event-closed-1', voterId: 'trans-sup-1', votedForIds: ['trans-col-1', 'inv-col-1', 'rh-col-1'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-2', eventId: 'event-closed-1', voterId: 'trans-coord-1', votedForIds: ['trans-col-3', 'inv-col-2', 'rh-col-3'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-3', eventId: 'event-closed-1', voterId: 'trans-col-1', votedForIds: ['trans-col-4', 'inv-col-1', 'rh-col-4'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-4', eventId: 'event-closed-1', voterId: 'trans-col-2', votedForIds: ['trans-col-1', 'inv-col-5', 'rh-col-1'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-5', eventId: 'event-closed-1', voterId: 'trans-col-3', votedForIds: ['trans-col-1', 'inv-col-1', 'rh-col-3'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-6', eventId: 'event-closed-1', voterId: 'trans-col-4', votedForIds: ['trans-col-1', 'inv-col-2', 'rh-col-1'], voteDate: new Date('2024-11-12') },
    { id: 'vote-closed-7', eventId: 'event-closed-1', voterId: 'trans-col-5', votedForIds: ['trans-col-3', 'inv-col-1', 'rh-col-4'], voteDate: new Date('2024-11-12') },
    
    { id: 'vote-closed-8', eventId: 'event-closed-1', voterId: 'inv-sup-1', votedForIds: ['inv-col-1', 'trans-col-1', 'rh-col-1'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-9', eventId: 'event-closed-1', voterId: 'inv-coord-1', votedForIds: ['inv-col-2', 'trans-col-3', 'rh-col-3'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-10', eventId: 'event-closed-1', voterId: 'inv-col-1', votedForIds: ['inv-col-5', 'trans-col-1', 'rh-col-1'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-11', eventId: 'event-closed-1', voterId: 'inv-col-2', votedForIds: ['inv-col-1', 'trans-col-4', 'rh-col-3'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-12', eventId: 'event-closed-1', voterId: 'inv-col-3', votedForIds: ['inv-col-1', 'trans-col-1', 'rh-col-4'], voteDate: new Date('2024-11-12') },
    { id: 'vote-closed-13', eventId: 'event-closed-1', voterId: 'inv-col-4', votedForIds: ['inv-col-2', 'trans-col-3', 'rh-col-1'], voteDate: new Date('2024-11-12') },
    { id: 'vote-closed-14', eventId: 'event-closed-1', voterId: 'inv-col-5', votedForIds: ['inv-col-1', 'trans-col-1', 'rh-col-3'], voteDate: new Date('2024-11-13') },
    
    { id: 'vote-closed-15', eventId: 'event-closed-1', voterId: 'rh-sup-1', votedForIds: ['rh-col-1', 'trans-col-1', 'inv-col-1'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-16', eventId: 'event-closed-1', voterId: 'rh-coord-1', votedForIds: ['rh-col-3', 'trans-col-3', 'inv-col-2'], voteDate: new Date('2024-11-10') },
    { id: 'vote-closed-17', eventId: 'event-closed-1', voterId: 'rh-col-1', votedForIds: ['rh-col-4', 'trans-col-1', 'inv-col-1'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-18', eventId: 'event-closed-1', voterId: 'rh-col-2', votedForIds: ['rh-col-1', 'trans-col-4', 'inv-col-5'], voteDate: new Date('2024-11-11') },
    { id: 'vote-closed-19', eventId: 'event-closed-1', voterId: 'rh-col-3', votedForIds: ['rh-col-1', 'trans-col-1', 'inv-col-1'], voteDate: new Date('2024-11-12') },
    { id: 'vote-closed-20', eventId: 'event-closed-1', voterId: 'rh-col-4', votedForIds: ['rh-col-3', 'trans-col-3', 'inv-col-2'], voteDate: new Date('2024-11-12') },
    { id: 'vote-closed-21', eventId: 'event-closed-1', voterId: 'rh-col-5', votedForIds: ['rh-col-1', 'trans-col-1', 'inv-col-1'], voteDate: new Date('2024-11-13') }
];

export const auditLogs: AuditLog[] = [
    { id: 'log-1', userId: 'admin-1', action: 'Inicio de Sesión', timestamp: new Date(), details: { ip: '192.168.1.100' } },
    { id: 'log-2', userId: 'trans-sup-1', action: 'Nominar Colaborador', timestamp: new Date('2024-12-02'), details: { collaboratorId: 'trans-col-1', eventId: 'event-active-1' } },
    { id: 'log-3', userId: 'inv-sup-1', action: 'Nominar Colaborador', timestamp: new Date('2024-12-03'), details: { collaboratorId: 'inv-col-1', eventId: 'event-active-1' } },
    { id: 'log-4', userId: 'rh-sup-1', action: 'Nominar Colaborador', timestamp: new Date('2024-12-04'), details: { collaboratorId: 'rh-col-1', eventId: 'event-active-1' } },
    { id: 'log-5', userId: 'admin-1', action: 'Crear Evento', timestamp: new Date('2024-12-01'), details: { eventId: 'event-active-1', eventName: 'Diciembre 2024' } },
    { id: 'log-6', userId: 'admin-1', action: 'Cerrar Evento', timestamp: new Date('2024-11-21'), details: { eventId: 'event-closed-1', eventName: 'Noviembre 2024' } },
];

// Test nominated entries data for departments - Results from closed event (Noviembre 2024)
export const testNominatedEntries: Record<Department, NominatedEntry[]> = {
    "Transporte": [
        { votes: 12, user: 'trans-col-1', event: 'event-closed-1', votedby: ['trans-sup-1', 'trans-col-2', 'trans-col-3', 'trans-col-4', 'inv-sup-1', 'inv-col-1', 'inv-col-3', 'rh-sup-1', 'rh-col-3', 'rh-col-5'], surveyResult: 92 },
        { votes: 6, user: 'trans-col-3', event: 'event-closed-1', votedby: ['trans-coord-1', 'trans-col-5', 'inv-coord-1', 'rh-coord-1', 'rh-col-4'], surveyResult: 78 },
        { votes: 4, user: 'trans-col-4', event: 'event-closed-1', votedby: ['trans-col-1', 'inv-col-2', 'rh-col-2'], surveyResult: 71 },
    ],
    "Gestion de Inventario": [
        { votes: 10, user: 'inv-col-1', event: 'event-closed-1', votedby: ['inv-sup-1', 'inv-col-2', 'inv-col-3', 'inv-col-5', 'trans-sup-1', 'trans-col-3', 'rh-sup-1', 'rh-col-1', 'rh-col-3'], surveyResult: 88 },
        { votes: 5, user: 'inv-col-2', event: 'event-closed-1', votedby: ['inv-coord-1', 'inv-col-4', 'trans-col-4', 'rh-coord-1', 'rh-col-4'], surveyResult: 75 },
        { votes: 3, user: 'inv-col-5', event: 'event-closed-1', votedby: ['inv-col-1', 'trans-col-2', 'rh-col-2'], surveyResult: 69 },
    ],
    "Recursos Humanos": [
        { votes: 11, user: 'rh-col-1', event: 'event-closed-1', votedby: ['rh-sup-1', 'rh-col-2', 'rh-col-3', 'rh-col-5', 'trans-sup-1', 'trans-col-2', 'trans-col-4', 'inv-sup-1', 'inv-col-1', 'inv-col-4'], surveyResult: 95 },
        { votes: 6, user: 'rh-col-3', event: 'event-closed-1', votedby: ['rh-coord-1', 'rh-col-4', 'trans-coord-1', 'trans-col-5', 'inv-coord-1', 'inv-col-5'], surveyResult: 82 },
        { votes: 4, user: 'rh-col-4', event: 'event-closed-1', votedby: ['rh-col-1', 'trans-col-5', 'inv-col-1'], surveyResult: 74 },
    ]
};
