export type Role = "Admin" | "Supervisor" | "Coordinator" | "Collaborator";

export type Department = "Technology" | "Marketing" | "Sales" | "Human Resources";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department;
  avatar: string;
}

export interface VotingEvent {
  id: string;
  department?: Department | "All Departments";
  status: "Pending" | "Active" | "Closed";
  startDate?: Date;
  endDate?: Date;
  month: string;
}

export interface Nomination {
  id: string;
  eventId: string;
  collaboratorId: string;
  nominatedById: string;
  nominationDate: Date;
}

export interface Vote {
  id: string;
  eventId: string;
  voterId: string;
  votedForIds: string[];
  voteDate: Date;
}


export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details: Record<string, any>;
}
