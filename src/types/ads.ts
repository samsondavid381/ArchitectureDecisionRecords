// src/types/adr.ts

export type ADRStatus = 'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded' | 'hypothesized' | 'confirmed';

export interface StatusChange {
  id: string;
  from: ADRStatus;
  to: ADRStatus;
  date: string;
  reason: string;
}

export interface CodeReference {
  id: string;
  path: string; // File or directory path
  snippet?: string; // Optional code snippet
  description: string;
}

export interface ADR {
  id: string;
  title: string;
  status: ADRStatus;
  createdAt: string;
  updatedAt: string;
  problem: string; // What issue does this decision address?
  context: string; // Additional context about the problem
  options: Array<{
    id: string;
    title: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  decision: string; // The chosen solution and why
  outcome: string; // The expected or observed result of this decision
  tags: string[]; // For both technical domains and status
  relatedADRs: string[]; // IDs of related ADRs
  codeReferences: CodeReference[]; // Links to relevant code
  statusHistory: StatusChange[]; // History of status changes
  projectId?: string; // Optional project association
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Quick capture note that can later be developed into a full ADR
export interface ArchitectureNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  tags: string[];
  codeReferences: CodeReference[];
  adrId?: string; // If converted to a full ADR
}