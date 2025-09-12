import type { User, Department, Role, VotingEvent, Nomination, Vote, AuditLog } from './types';

export const departments: Department[] = ["Technology", "Marketing", "Sales", "Human Resources"];

export const users: User[] = [
  { id: 'user-1', name: 'Usuario Admin', email: 'admin@example.com', role: 'Admin', department: 'Technology', avatar: 'https://picsum.photos/id/1/100' },
  { id: 'user-2', name: 'Sofia Davis', email: 'supervisor.tech@example.com', role: 'Supervisor', department: 'Technology', avatar: 'https://picsum.photos/id/2/100' },
  { id: 'user-3', name: 'Alex Johnson', email: 'collaborator.tech@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/3/100' },
  { id: 'user-4', name: 'Maria Garcia', email: 'coordinator.tech@example.com', role: 'Coordinator', department: 'Technology', avatar: 'https://picsum.photos/id/4/100' },
  { id: 'user-5', name: 'David Smith', email: 'supervisor.mktg@example.com', role: 'Supervisor', department: 'Marketing', avatar: 'https://picsum.photos/id/5/100' },
  { id: 'user-6', name: 'Emily White', email: 'collaborator.mktg@example.com', role: 'Collaborator', department: 'Marketing', avatar: 'https://picsum.photos/id/6/100' },
  { id: 'user-7', name: 'James Brown', email: 'collaborator.tech.2@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/7/100' },
  { id: 'user-8', name: 'Linda Miller', email: 'collaborator.tech.3@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/8/100' },
  { id: 'user-9', name: 'Casey Jones', email: 'collaborator.tech.4@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/9/100' },
  { id: 'user-10', name: 'Jordan Taylor', email: 'collaborator.tech.5@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/10/100' },
  { id: 'user-11', name: 'Morgan Lee', email: 'collaborator.tech.6@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/11/100' },
  { id: 'user-12', name: 'Taylor Swift', email: 'collaborator.tech.7@example.com', role: 'Collaborator', department: 'Technology', avatar: 'https://picsum.photos/id/12/100' },
  { id: 'user-13', name: 'Chris Green', email: 'collaborator.mktg.2@example.com', role: 'Collaborator', department: 'Marketing', avatar: 'https://picsum.photos/id/13/100' },
  { id: 'user-14', name: 'Patricia Hill', email: 'collaborator.mktg.3@example.com', role: 'Collaborator', department: 'Marketing', avatar: 'https://picsum.photos/id/14/100' },
  { id: 'user-15', name: 'Robert Hall', email: 'supervisor.sales@example.com', role: 'Supervisor', department: 'Sales', avatar: 'https://picsum.photos/id/15/100' },
  { id: 'user-16', name: 'Jennifer Adams', email: 'collaborator.sales.1@example.com', role: 'Collaborator', department: 'Sales', avatar: 'https://picsum.photos/id/16/100' },
  { id: 'user-17', name: 'Michael Nelson', email: 'collaborator.sales.2@example.com', role: 'Collaborator', department: 'Sales', avatar: 'https://picsum.photos/id/17/100' },
  { id: 'user-18', name: 'Barbara Carter', email: 'supervisor.hr@example.com', role: 'Supervisor', department: 'Human Resources', avatar: 'https://picsum.photos/id/18/100' },
  { id: 'user-19', name: 'William Baker', email: 'collaborator.hr.1@example.com', role: 'Collaborator', department: 'Human Resources', avatar: 'https://picsum.photos/id/19/100' },
  { id: 'user-20', name: 'Elizabeth Clark', email: 'collaborator.hr.2@example.com', role: 'Collaborator', department: 'Human Resources', avatar: 'https://picsum.photos/id/20/100' },
  { id: 'user-21', name: 'Joseph Lewis', email: 'coordinator.mktg@example.com', role: 'Coordinator', department: 'Marketing', avatar: 'https://picsum.photos/id/21/100' },
  { id: 'user-22', name: 'Susan Walker', email: 'coordinator.sales@example.com', role: 'Coordinator', department: 'Sales', avatar: 'https://picsum.photos/id/22/100' },
  { id: 'user-23', name: 'Thomas Robinson', email: 'coordinator.hr@example.com', role: 'Coordinator', department: 'Human Resources', avatar: 'https://picsum.photos/id/23/100' },
  { id: 'user-24', name: 'Jessica Wright', email: 'collaborator.sales.3@example.com', role: 'Collaborator', department: 'Sales', avatar: 'https://picsum.photos/id/24/100' }
];

const defaultSurveyQuestions = [
    { title: 'Trabajo en Equipo', body: '¿Qué tan bien colabora esta persona con otros?' },
    { title: 'Innovación', body: '¿Aporta esta persona ideas nuevas y creativas a la mesa?' },
    { title: 'Liderazgo', body: '¿Demuestra esta persona cualidades de liderazgo, incluso sin un título formal?' },
    { title: 'Resolución de Problemas', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
    { title: 'Contribución General', body: '¿Cuál ha sido la contribución más significativa de esta persona este mes?' }
];

export const votingEvents: VotingEvent[] = [
    { id: 'event-1', department: 'Technology', status: 'Active', month: 'Julio 2024', startDate: new Date('2024-07-01'), endDate: new Date('2024-07-25'), surveyQuestions: defaultSurveyQuestions },
    { id: 'event-2', department: 'Marketing', status: 'Pending', month: 'Julio 2024', surveyQuestions: [] },
    { id: 'event-3', department: 'All Departments', status: 'Closed', month: 'Junio 2024', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-25'), surveyQuestions: defaultSurveyQuestions },
    { id: 'event-4', department: 'Human Resources', status: 'Closed', month: 'Junio 2024', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-25'), surveyQuestions: defaultSurveyQuestions },
];

export const nominations: Nomination[] = [
    { id: 'nom-1', eventId: 'event-1', collaboratorId: 'user-3', nominatedById: 'user-2', nominationDate: new Date() },
    { id: 'nom-2', eventId: 'event-1', collaboratorId: 'user-7', nominatedById: 'user-2', nominationDate: new Date() },
    { id: 'nom-3', eventId: 'event-3', collaboratorId: 'user-6', nominatedById: 'user-5', nominationDate: new Date('2024-06-05') },
];

export const votes: Vote[] = [
    { id: 'vote-1', eventId: 'event-3', voterId: 'some-user', votedForIds: ['user-id-in-sales'], voteDate: new Date() }
];

export const auditLogs: AuditLog[] = [
    { id: 'log-1', userId: 'user-1', action: 'Inicio de Sesión', timestamp: new Date(), details: { ip: '192.168.1.1' } },
    { id: 'log-2', userId: 'user-2', action: 'Nominar Colaborador', timestamp: new Date(), details: { collaboratorId: 'user-3' } },
];
