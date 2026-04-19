#!/usr/bin/env python3
"""
Kai Agent - HuggingFace Data Downloader
Downloads real datasets and converts to TypeScript format for the neural brain
"""

import json
import os
import sys
from pathlib import Path
from typing import Any
from datasets import load_dataset
from huggingface_hub import hf_hub_download, list_repo_files
import hashlib

# Output directory
OUTPUT_DIR = Path("/home/workspace/kai-agent-repo/data/huggingface")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Track all downloaded data
MANIFEST = {
    "datasets": {},
    "total_samples": 0,
    "total_bytes": 0,
    "downloaded_at": ""
}

def sanitize_for_typescript(data: Any) -> Any:
    """Convert Python data structures to TypeScript-compatible format"""
    if isinstance(data, dict):
        return {k: sanitize_for_typescript(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_for_typescript(item) for item in data]
    elif isinstance(data, (int, float, str, bool, type(None))):
        return data
    else:
        return str(data)

def generate_ts_interface(name: str, sample: dict) -> str:
    """Generate TypeScript interface from sample data"""
    lines = [f"export interface {name} {{"]
    
    for key, value in sample.items():
        if isinstance(value, str):
            ts_type = "string"
        elif isinstance(value, int):
            ts_type = "number"
        elif isinstance(value, float):
            ts_type = "number"
        elif isinstance(value, bool):
            ts_type = "boolean"
        elif isinstance(value, list):
            ts_type = "any[]"
        elif isinstance(value, dict):
            ts_type = "Record<string, any>"
        elif value is None:
            ts_type = "any"
        else:
            ts_type = "any"
        
        lines.append(f"  {key}: {ts_type};")
    
    lines.append("}")
    return "\n".join(lines)

def save_as_typescript(name: str, data: list, sample: dict) -> str:
    """Save data as TypeScript file with type definitions"""
    interface_name = "".join(word.capitalize() for word in name.replace("-", "_").split("_"))
    
    ts_content = f"""// Auto-generated from HuggingFace dataset
// Source: {name}
// Samples: {len(data)}

{generate_ts_interface(interface_name, sample)}

export const {name.replace("-", "_")}_DATA: {interface_name}[] = {json.dumps(data, indent=2, ensure_ascii=False)};

export default {name.replace("-", "_")}_DATA;
"""
    
    filepath = OUTPUT_DIR / f"{name}.ts"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(ts_content)
    
    return str(filepath)

def save_as_jsonl(name: str, data: list) -> str:
    """Save data as JSONL for efficient loading"""
    filepath = OUTPUT_DIR / f"{name}.jsonl"
    with open(filepath, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    return str(filepath)

def download_codealpaca():
    """Download CodeAlpaca 20K dataset"""
    print("\n📥 Downloading CodeAlpaca 20K...")
    try:
        dataset = load_dataset("HuggingFaceH4/CodeAlpaca_20K", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("instruction", ""),
                "input": item.get("input", ""),
                "output": item.get("output", ""),
                "category": "code_generation"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("codealpaca_20k", data[:5000], sample)  # First 5K for TS
        jsonl_path = save_as_jsonl("codealpaca_20k_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["codealpaca_20k"] = {
            "samples": len(data),
            "source": "HuggingFaceH4/CodeAlpaca_20K"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_magicoder_oss():
    """Download Magicoder OSS Instruct 75K"""
    print("\n📥 Downloading Magicoder OSS Instruct 75K...")
    try:
        dataset = load_dataset("ise-uiuc/Magicoder-OSS-Instruct-75K", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("problem", "") or item.get("instruction", ""),
                "solution": item.get("solution", "") or item.get("response", ""),
                "language": item.get("lang", "unknown"),
                "category": "code_instruction"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("magicoder_oss_75k", data[:5000], sample)
        jsonl_path = save_as_jsonl("magicoder_oss_75k_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["magicoder_oss_75k"] = {
            "samples": len(data),
            "source": "ise-uiuc/Magicoder-OSS-Instruct-75K"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_magicoder_evol():
    """Download Magicoder Evol Instruct 110K"""
    print("\n📥 Downloading Magicoder Evol Instruct 110K...")
    try:
        dataset = load_dataset("ise-uiuc/Magicoder-Evol-Instruct-110K", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("instruction", ""),
                "output": item.get("response", "") or item.get("output", ""),
                "category": "code_evolution"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("magicoder_evol_110k", data[:5000], sample)
        jsonl_path = save_as_jsonl("magicoder_evol_110k_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["magicoder_evol_110k"] = {
            "samples": len(data),
            "source": "ise-uiuc/Magicoder-Evol-Instruct-110K"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_vulnerabilities():
    """Download software vulnerabilities dataset"""
    print("\n📥 Downloading Software Vulnerabilities Dataset...")
    try:
        dataset = load_dataset("darkknight25/software_vulnerabilities_dataset", split="train")
        data = []
        for item in dataset:
            data.append({
                "id": item.get("id", ""),
                "vulnerability_type": item.get("vulnerability_type", ""),
                "description": item.get("description", ""),
                "code_snippet": item.get("code_snippet", ""),
                "mitigation": item.get("mitigation", ""),
                "language": item.get("programming_language", "unknown"),
                "category": "security_vulnerability"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("vulnerabilities_1000", data, sample)
        jsonl_path = save_as_jsonl("vulnerabilities_1000_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["vulnerabilities"] = {
            "samples": len(data),
            "source": "darkknight25/software_vulnerabilities_dataset"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_exploit_database():
    """Download exploit database dataset"""
    print("\n📥 Downloading Exploit Database Dataset...")
    try:
        dataset = load_dataset("darkknight25/Exploit_Database_Dataset", split="train")
        data = []
        for item in dataset:
            data.append({
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "exploit_code": item.get("exploit_code", ""),
                "category": "exploit"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("exploit_database", data, sample)
        jsonl_path = save_as_jsonl("exploit_database_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["exploit_database"] = {
            "samples": len(data),
            "source": "darkknight25/Exploit_Database_Dataset"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_cybersecurity_eval():
    """Download CyberSecurity Eval dataset"""
    print("\n📥 Downloading CyberSecurity Eval Dataset...")
    try:
        dataset = load_dataset("CyberNative/CyberSecurityEval", split="train")
        data = []
        for item in dataset:
            data.append({
                "question": item.get("question", "") or item.get("input", ""),
                "options": item.get("options", []) or item.get("choices", []),
                "answer": item.get("answer", "") or item.get("target", ""),
                "category": "security_qa"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("cybersecurity_eval", data[:5000], sample)
        jsonl_path = save_as_jsonl("cybersecurity_eval_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["cybersecurity_eval"] = {
            "samples": len(data),
            "source": "CyberNative/CyberSecurityEval"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_code_instructions():
    """Download code instructions 120K"""
    print("\n📥 Downloading Code Instructions 120K...")
    try:
        dataset = load_dataset("iamtarun/code_instructions_120k_alpaca", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("instruction", ""),
                "input": item.get("input", ""),
                "output": item.get("output", ""),
                "category": "code_instruction"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("code_instructions_120k", data[:5000], sample)
        jsonl_path = save_as_jsonl("code_instructions_120k_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["code_instructions_120k"] = {
            "samples": len(data),
            "source": "iamtarun/code_instructions_120k_alpaca"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_the_stack_smol():
    """Download The Stack Smol (subset of 6TB code dataset)"""
    print("\n📥 Downloading The Stack Smol...")
    try:
        # Download Python subset
        dataset = load_dataset("bigcode/the-stack-smol", data_dir="data/python", split="train", trust_remote_code=True)
        data = []
        for i, item in enumerate(dataset):
            if i >= 10000:  # Limit to 10K samples
                break
            data.append({
                "code": item.get("content", "") or item.get("code", ""),
                "language": "python",
                "category": "source_code"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("the_stack_python", data, sample)
        jsonl_path = save_as_jsonl("the_stack_python_full", data)
        
        print(f"   ✅ Downloaded {len(data)} Python samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["the_stack_python"] = {
            "samples": len(data),
            "source": "bigcode/the-stack-smol"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_opencode_instruct():
    """Download OpenCodeInstruct (5M samples) - sample subset"""
    print("\n📥 Downloading OpenCodeInstruct...")
    try:
        dataset = load_dataset("nvidia/OpenCodeInstruct", split="train", streaming=True)
        data = []
        count = 0
        for item in dataset:
            if count >= 10000:  # Sample 10K for TS, full will be JSONL
                break
            data.append({
                "instruction": item.get("instruction", "") or item.get("question", ""),
                "solution": item.get("solution", "") or item.get("response", ""),
                "language": item.get("language", "unknown"),
                "category": "code_instruction"
            })
            count += 1
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("opencode_instruct", data, sample)
        
        print(f"   ✅ Downloaded {len(data)} samples (streaming)")
        print(f"   📄 TypeScript: {ts_path}")
        
        MANIFEST["datasets"]["opencode_instruct"] = {
            "samples": len(data),
            "source": "nvidia/OpenCodeInstruct",
            "note": "Sampled from 5M full dataset"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_code_vulnerability_dpo():
    """Download Code Vulnerability Security DPO"""
    print("\n📥 Downloading Code Vulnerability Security DPO...")
    try:
        dataset = load_dataset("CyberNative/Code_Vulnerability_Security_DPO", split="train")
        data = []
        for item in dataset:
            data.append({
                "prompt": item.get("prompt", ""),
                "chosen": item.get("chosen", ""),
                "rejected": item.get("rejected", ""),
                "category": "security_dpo"
            })
        
        sample = data[0] if data else {}
        ts_path = save_as_typescript("code_vulnerability_dpo", data, sample)
        jsonl_path = save_as_jsonl("code_vulnerability_dpo_full", data)
        
        print(f"   ✅ Downloaded {len(data)} samples")
        print(f"   📄 TypeScript: {ts_path}")
        print(f"   📄 JSONL: {jsonl_path}")
        
        MANIFEST["datasets"]["code_vulnerability_dpo"] = {
            "samples": len(data),
            "source": "CyberNative/Code_Vulnerability_Security_DPO"
        }
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def generate_knowledge_base(all_data: dict):
    """Generate comprehensive knowledge base TypeScript file"""
    print("\n🔨 Generating Knowledge Base...")
    
    kb_content = """// Kai Agent - Knowledge Base
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
"""
    
    kb_path = OUTPUT_DIR / "knowledge_base.ts"
    with open(kb_path, "w", encoding="utf-8") as f:
        f.write(kb_content)
    
    print(f"   ✅ Generated knowledge_base.ts")
    return str(kb_path)

def generate_data_index():
    """Generate index file that exports all datasets"""
    print("\n🔨 Generating Data Index...")
    
    files = list(OUTPUT_DIR.glob("*.ts"))
    exports = []
    
    for f in files:
        if f.stem not in ["index", "knowledge_base"]:
            exports.append(f"export {{ default as {f.stem}, {f.stem.replace('-', '_')}_DATA }} from './{f.stem}';")
    
    index_content = f"""// Kai Agent - HuggingFace Data Index
// Auto-generated - DO NOT EDIT

{chr(10).join(exports)}

export {{ KNOWLEDGE_BASE, LANGUAGE_STATS, KnowledgeEntry, CodeKnowledge, SecurityKnowledge, InstructionKnowledge }} from './knowledge_base';

// Dataset statistics
export const DATASET_STATS = {{
  totalDatasets: {len(MANIFEST['datasets'])},
  totalSamples: {MANIFEST['total_samples']},
  datasets: {{
{chr(10).join(f"    '{k}': {{ source: '{v['source']}', samples: {v['samples']} }}" for k, v in MANIFEST['datasets'].items())}
  }}
}};

export default {{
  stats: DATASET_STATS,
}};
"""
    
    index_path = OUTPUT_DIR / "index.ts"
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_content)
    
    print(f"   ✅ Generated index.ts")
    return str(index_path)

def save_manifest():
    """Save download manifest"""
    from datetime import datetime
    MANIFEST["downloaded_at"] = datetime.now().isoformat()
    
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(MANIFEST, f, indent=2)
    
    print(f"\n📋 Manifest saved to {manifest_path}")

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║         KAI AGENT - HUGGINGFACE DATA DOWNLOADER              ║
║                                                              ║
║  Downloading real datasets for the neural brain               ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Download all datasets
    all_data = {}
    
    # Code datasets
    all_data['codealpaca'] = download_codealpaca()
    all_data['magicoder_oss'] = download_magicoder_oss()
    all_data['magicoder_evol'] = download_magicoder_evol()
    all_data['code_instructions'] = download_code_instructions()
    all_data['the_stack'] = download_the_stack_smol()
    all_data['opencode'] = download_opencode_instruct()
    
    # Security datasets
    all_data['vulnerabilities'] = download_vulnerabilities()
    all_data['exploits'] = download_exploit_database()
    all_data['cyber_eval'] = download_cybersecurity_eval()
    all_data['vuln_dpo'] = download_code_vulnerability_dpo()
    
    # Generate knowledge base
    generate_knowledge_base(all_data)
    
    # Generate index
    generate_data_index()
    
    # Save manifest
    save_manifest()
    
    # Calculate total size
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob("*") if f.is_file())
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    DOWNLOAD COMPLETE                          ║
╠══════════════════════════════════════════════════════════════╣
║  Total Datasets:    {len(MANIFEST['datasets']):<10}                           ║
║  Total Samples:     {MANIFEST['total_samples']:<10}                           ║
║  Total Size:        {total_size / 1024 / 1024:.2f} MB                          ║
║  Output Directory:  {str(OUTPUT_DIR):<30}  ║
╚══════════════════════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    main()
