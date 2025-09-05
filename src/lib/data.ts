import type { User, Department, Role, VotingEvent, Nomination, Vote, AuditLog } from './types';

export const departments: Department[] = ["Technology", "Marketing", "Sales", "Human Resources"];

export const users: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', department: 'Technology', avatar: '/avatars/01.png' },
  { id: 'user-2', name: 'Sofia Davis', email: 'supervisor.tech@example.com', role: 'Supervisor', department: 'Technology', avatar: '/avatars/02.png' },
  { id: 'user-3', name: 'Alex Johnson', email: 'collaborator.tech@example.com', role: 'Collaborator', department: 'Technology', avatar: '/avatars/03.png' },
  { id: 'user-4', name: 'Maria Garcia', email: 'coordinator.tech@example.com', role: 'Coordinator', department: 'Technology', avatar: '/avatars/04.png' },
  { id: 'user-5', name: 'David Smith', email: 'supervisor.mktg@example.com', role: 'Supervisor', department: 'Marketing', avatar: '/avatars/05.png' },
  { id: 'user-6', name: 'Emily White', email: 'collaborator.mktg@example.com', role: 'Collaborator', department: 'Marketing', avatar: '/avatars/01.png' },
  { id: 'user-7', name: 'James Brown', email: 'collaborator.tech.2@example.com', role: 'Collaborator', department: 'Technology', avatar: '/avatars/02.png' },
  { id: 'user-8', name: 'Linda Miller', email: 'collaborator.tech.3@example.com', role: 'Collaborator', department: 'Technology', avatar: '/avatars/03.png' },
];

export const votingEvents: VotingEvent[] = [
    { id: 'event-1', department: 'Technology', status: 'Active', month: 'July 2024', startDate: new Date('2024-07-01'), endDate: new Date('2024-07-25') },
    { id: 'event-2', department: 'Marketing', status: 'Pending', month: 'July 2024' },
    { id: 'event-3', department: 'Sales', status: 'Closed', month: 'June 2024', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-25') },
    { id: 'event-4', department: 'Human Resources', status: 'Closed', month: 'June 2024', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-25') },
];

export const nominations: Nomination[] = [
    { id: 'nom-1', eventId: 'event-1', collaboratorId: 'user-3', nominatedById: 'user-2', nominationDate: new Date() },
    { id: 'nom-2', eventId: 'event-1', collaboratorId: 'user-7', nominatedById: 'user-2', nominationDate: new Date() },
    { id: 'nom-3', eventId: 'event-1', collaboratorId: 'user-8', nominatedById: 'user-2', nominationDate: new Date() },
];

export const votes: Vote[] = [
    { id: 'vote-1', eventId: 'event-3', voterId: 'some-user', votedForIds: ['user-id-in-sales'], voteDate: new Date() }
];

export const auditLogs: AuditLog[] = [
    { id: 'log-1', userId: 'user-1', action: 'Login', timestamp: new Date(), details: { ip: '192.168.1.1' } },
    { id: 'log-2', userId: 'user-2', action: 'Nominate Collaborator', timestamp: new Date(), details: { collaboratorId: 'user-3' } },
];
