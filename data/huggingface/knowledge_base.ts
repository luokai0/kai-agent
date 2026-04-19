// Kai Agent - Knowledge Base
// Auto-generated from HuggingFace datasets
// DO NOT EDIT - Regenerate with download script

export interface KnowledgeEntry {
  id: string;
  content: string;
  category: 'code' | 'security' | 'instruction' | 'vulnerability' | 'exploit';
  language?: string;
  tags: string[];
  embedding?: number[];
}

export interface CodeKnowledge extends KnowledgeEntry {
  code: string;
  language: string;
  explanation?: string;
}

export interface SecurityKnowledge extends KnowledgeEntry {
  vulnerability_type?: string;
  mitigation?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface InstructionKnowledge extends KnowledgeEntry {
  instruction: string;
  input?: string;
  output: string;
}

// Combined knowledge base
export const KNOWLEDGE_BASE = {
  code: [] as CodeKnowledge[],
  security: [] as SecurityKnowledge[],
  instruction: [] as InstructionKnowledge[],
  
  // Statistics
  stats: {
    totalEntries: 0,
    codeEntries: 0,
    securityEntries: 0,
    instructionEntries: 0,
    languages: new Set<string>(),
  },
  
  // Search methods
  searchCode(query: string): CodeKnowledge[] {
    return this.code.filter(entry => 
      entry.content.toLowerCase().includes(query.toLowerCase()) ||
      entry.code.toLowerCase().includes(query.toLowerCase())
    );
  },
  
  searchSecurity(query: string): SecurityKnowledge[] {
    return this.security.filter(entry =>
      entry.content.toLowerCase().includes(query.toLowerCase()) ||
      (entry.vulnerability_type?.toLowerCase().includes(query.toLowerCase()))
    );
  },
  
  searchInstructions(query: string): InstructionKnowledge[] {
    return this.instruction.filter(entry =>
      entry.instruction.toLowerCase().includes(query.toLowerCase())
    );
  },
  
  getAll(): KnowledgeEntry[] {
    return [...this.code, ...this.security, ...this.instruction];
  },
  
  getByLanguage(lang: string): CodeKnowledge[] {
    return this.code.filter(entry => entry.language === lang);
  },
  
  getByCategory(cat: string): KnowledgeEntry[] {
    switch(cat) {
      case 'code': return this.code;
      case 'security': return this.security;
      case 'instruction': return this.instruction;
      default: return this.getAll();
    }
  }
};

// Language statistics
export const LANGUAGE_STATS = {
  python: { count: 0, percentage: 0 },
  javascript: { count: 0, percentage: 0 },
  typescript: { count: 0, percentage: 0 },
  java: { count: 0, percentage: 0 },
  cpp: { count: 0, percentage: 0 },
  rust: { count: 0, percentage: 0 },
  go: { count: 0, percentage: 0 },
  other: { count: 0, percentage: 0 }
};

export default KNOWLEDGE_BASE;
