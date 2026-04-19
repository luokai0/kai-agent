/**
 * Kai Agent - Phase 4
 * Advanced Neural AI Brain
 */

// Core components
export * from './src/agent';
export * from './src/agent-phase4';

// Neural networks
export * from './src/neural';
export * from './src/neural/matrix';
export * from './src/neural/network';
export * from './src/neural/attention/multihead';
export * from './src/neural/transformer/encoder';
export * from './src/neural/lstm/lstm';
export * from './src/neural/gru/gru';
export * from './src/neural/convolutional/conv';

// Memory and reasoning
export * from './src/memory/brain';
export * from './src/thoughts/engine';
export * from './src/cells/system';
export * from './src/cells/knowledge-cell';
export * from './src/cells/coder-cell';
export * from './src/cells/security-cell';

// Phase 4 modules
export * from './src/personality';
export * from './src/plugins';
export * from './src/security';
export * from './src/performance';
export * from './src/knowledge';

// Default export
import { KaiAgentPhase4 } from './src/agent-phase4';
export default KaiAgentPhase4;
