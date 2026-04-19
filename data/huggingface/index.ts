// Kai Agent - HuggingFace Data Index
// Auto-generated - DO NOT EDIT

export { default as codealpaca_20k, codealpaca_20k_DATA } from './codealpaca_20k';
export { default as magicoder_oss_75k, magicoder_oss_75k_DATA } from './magicoder_oss_75k';
export { default as magicoder_evol_110k, magicoder_evol_110k_DATA } from './magicoder_evol_110k';
export { default as code_instructions_120k, code_instructions_120k_DATA } from './code_instructions_120k';
export { default as opencode_instruct, opencode_instruct_DATA } from './opencode_instruct';
export { default as code_vulnerability_dpo, code_vulnerability_dpo_DATA } from './code_vulnerability_dpo';

export { KNOWLEDGE_BASE, LANGUAGE_STATS, KnowledgeEntry, CodeKnowledge, SecurityKnowledge, InstructionKnowledge } from './knowledge_base';

// Dataset statistics
export const DATASET_STATS = {
  totalDatasets: 6,
  totalSamples: 341014,
  datasets: {
    'codealpaca_20k': { source: 'HuggingFaceH4/CodeAlpaca_20K', samples: 18019 }
    'magicoder_oss_75k': { source: 'ise-uiuc/Magicoder-OSS-Instruct-75K', samples: 75197 }
    'magicoder_evol_110k': { source: 'ise-uiuc/Magicoder-Evol-Instruct-110K', samples: 111183 }
    'code_instructions_120k': { source: 'iamtarun/code_instructions_120k_alpaca', samples: 121959 }
    'opencode_instruct': { source: 'nvidia/OpenCodeInstruct', samples: 10000 }
    'code_vulnerability_dpo': { source: 'CyberNative/Code_Vulnerability_Security_DPO', samples: 4656 }
  }
};

export default {
  stats: DATASET_STATS,
};
