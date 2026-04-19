/**
 * Agent Personality System
 * Configurable traits and response style adaptation
 */

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  formality: number;
  verbosity: number;
  technicality: number;
  empathy: number;
  humor: number;
  creativity: number;
  assertiveness: number;
  patience: number;
}

export interface PersonalityProfile {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTraits;
  responseStyle: ResponseStyle;
  expertiseLevel: string;
  preferredTopics: string[];
}

export interface ResponseStyle {
  tone: string;
  structure: string;
  depth: string;
  examples: boolean;
  analogies: boolean;
  emoji: boolean;
  markdown: boolean;
}

export interface ResponseContext {
  userInput: string;
  topic: string;
  complexity: number;
  needsExamples: boolean;
  needsAnalogies: boolean;
}

const DEFAULT_TRAITS: PersonalityTraits = {
  openness: 0.8,
  conscientiousness: 0.8,
  extraversion: 0.6,
  agreeableness: 0.5,
  neuroticism: 0.2,
  formality: 0.4,
  verbosity: 0.7,
  technicality: 0.8,
  empathy: 0.6,
  humor: 0.3,
  creativity: 0.7,
  assertiveness: 0.7,
  patience: 0.7
};

export const PROFILES: Record<string, PersonalityProfile> = {
  kai: {
    id: 'kai',
    name: 'Kai',
    description: 'Direct, honest, and detailed. Technical expert.',
    traits: {
      ...DEFAULT_TRAITS,
      openness: 0.9,
      assertiveness: 0.9,
      technicality: 0.9,
      empathy: 0.5
    },
    responseStyle: {
      tone: 'technical',
      structure: 'mixed',
      depth: 'detailed',
      examples: true,
      analogies: true,
      emoji: false,
      markdown: true
    },
    expertiseLevel: 'expert',
    preferredTopics: ['coding', 'security', 'ai', 'architecture']
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    description: 'Patient teacher who adapts to student level.',
    traits: {
      ...DEFAULT_TRAITS,
      agreeableness: 0.85,
      empathy: 0.9,
      patience: 0.95,
      assertiveness: 0.4
    },
    responseStyle: {
      tone: 'friendly',
      structure: 'mixed',
      depth: 'moderate',
      examples: true,
      analogies: true,
      emoji: true,
      markdown: true
    },
    expertiseLevel: 'expert',
    preferredTopics: ['teaching', 'learning', 'debugging']
  },
  security: {
    id: 'security',
    name: 'Security Expert',
    description: 'Paranoid security analyst.',
    traits: {
      ...DEFAULT_TRAITS,
      conscientiousness: 0.95,
      technicality: 0.95,
      creativity: 0.4,
      humor: 0.1
    },
    responseStyle: {
      tone: 'technical',
      structure: 'bullet',
      depth: 'comprehensive',
      examples: true,
      analogies: false,
      emoji: false,
      markdown: true
    },
    expertiseLevel: 'expert',
    preferredTopics: ['security', 'cryptography', 'vulnerabilities']
  }
};

export class PersonalityEngine {
  private profile: PersonalityProfile;
  
  constructor(profileId: string = 'kai') {
    this.profile = PROFILES[profileId] || PROFILES.kai;
  }
  
  getProfile(): PersonalityProfile {
    return this.profile;
  }
  
  setProfile(profileId: string): void {
    this.profile = PROFILES[profileId] || this.profile;
  }
  
  adaptResponse(rawResponse: string, context: ResponseContext): string {
    const { traits, responseStyle } = this.profile;
    let response = rawResponse;
    
    // Apply formality
    if (traits.formality > 0.7) {
      response = this.toFormal(response);
    } else if (traits.formality < 0.3) {
      response = this.toCasual(response);
    }
    
    // Adjust verbosity
    if (traits.verbosity < 0.3) {
      response = this.makeConcise(response);
    }
    
    return response;
  }
  
  private toFormal(text: string): string {
    return text
      .replace(/\bi\b/g, 'I')
      .replace(/can't/g, 'cannot')
      .replace(/won't/g, 'will not')
      .replace(/don't/g, 'do not');
  }
  
  private toCasual(text: string): string {
    return text
      .replace(/cannot/g, "can't")
      .replace(/will not/g, "won't");
  }
  
  private makeConcise(text: string): string {
    // Remove filler words
    return text
      .replace(/\bvery\s+/gi, '')
      .replace(/\breally\s+/gi, '')
      .replace(/\bbasically\s+/gi, '')
      .replace(/\bactually\s+/gi, '');
  }
  
  getTraits(): PersonalityTraits {
    return this.profile.traits;
  }
  
  getStyle(): ResponseStyle {
    return this.profile.responseStyle;
  }
}

export default PersonalityEngine;
