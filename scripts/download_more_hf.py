#!/usr/bin/env python3
"""
Kai Agent - Additional HuggingFace Data Downloader
"""

import json
from pathlib import Path
from datasets import load_dataset
from datetime import datetime

OUTPUT_DIR = Path("/home/workspace/kai-agent-repo/data/huggingface")
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"

with open(MANIFEST_PATH) as f:
    MANIFEST = json.load(f)

def save_as_typescript(name: str, data: list, sample: dict) -> str:
    interface_name = "".join(word.capitalize() for word in name.replace("-", "_").split("_"))
    
    def get_ts_type(value):
        if isinstance(value, str): return "string"
        if isinstance(value, int): return "number"
        if isinstance(value, float): return "number"
        if isinstance(value, bool): return "boolean"
        if isinstance(value, list): return "any[]"
        if isinstance(value, dict): return "Record<string, any>"
        return "any"
    
    interface_lines = ["export interface " + interface_name + " {"]
    for key, value in sample.items():
        interface_lines.append("  " + key + ": " + get_ts_type(value) + ";")
    interface_lines.append("}")
    
    ts_content = "// Auto-generated from HuggingFace dataset\n"
    ts_content += "// Source: " + name + "\n"
    ts_content += "// Samples: " + str(len(data)) + "\n\n"
    ts_content += "\n".join(interface_lines) + "\n\n"
    ts_content += "export const " + name.replace("-", "_") + "_DATA: " + interface_name + "[] = "
    ts_content += json.dumps(data, indent=2, ensure_ascii=False) + ";\n\n"
    ts_content += "export default " + name.replace("-", "_") + "_DATA;\n"
    
    filepath = OUTPUT_DIR / (name + ".ts")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(ts_content)
    
    return str(filepath)

def save_as_jsonl(name: str, data: list) -> str:
    filepath = OUTPUT_DIR / (name + ".jsonl")
    with open(filepath, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    return str(filepath)

def download_cybersecurity_eval():
    print("\n📥 Downloading CyberSecurity Eval...")
    try:
        dataset = load_dataset("CyberNative/CyberSecurityEval", split="test")
        data = []
        for item in dataset:
            data.append({
                "question": item.get("question", ""),
                "answer": item.get("answer", ""),
                "category": "security_qa"
            })
        
        ts_path = save_as_typescript("cybersecurity_eval", data, data[0] if data else {})
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["cybersecurity_eval"] = {"samples": len(data), "source": "CyberNative/CyberSecurityEval"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_humaneval():
    print("\n📥 Downloading HumanEval...")
    try:
        dataset = load_dataset("openai_humaneval", split="test")
        data = []
        for item in dataset:
            data.append({
                "task_id": item.get("task_id", ""),
                "prompt": item.get("prompt", ""),
                "canonical_solution": item.get("canonical_solution", ""),
                "test": item.get("test", ""),
                "category": "code_benchmark"
            })
        
        ts_path = save_as_typescript("humaneval", data, data[0] if data else {})
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["humaneval"] = {"samples": len(data), "source": "openai_humaneval"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_mbpp():
    print("\n📥 Downloading MBPP...")
    try:
        dataset = load_dataset("mbpp", split="test")
        data = []
        for item in dataset:
            data.append({
                "task_id": item.get("task_id", ""),
                "text": item.get("text", ""),
                "code": item.get("code", ""),
                "test_list": item.get("test_list", []),
                "category": "code_benchmark"
            })
        
        ts_path = save_as_typescript("mbpp", data, data[0] if data else {})
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["mbpp"] = {"samples": len(data), "source": "mbpp"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_alpaca():
    print("\n📥 Downloading Alpaca...")
    try:
        dataset = load_dataset("yahma/alpaca-cleaned", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("instruction", ""),
                "input": item.get("input", ""),
                "output": item.get("output", ""),
                "category": "instruction"
            })
        
        ts_path = save_as_typescript("alpaca_cleaned", data[:10000], data[0] if data else {})
        jsonl_path = save_as_jsonl("alpaca_cleaned_full", data)
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["alpaca_cleaned"] = {"samples": len(data), "source": "yahma/alpaca-cleaned"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_python_alpaca():
    print("\n📥 Downloading Python Alpaca...")
    try:
        dataset = load_dataset("Vezora/Python-Alpaca", split="train")
        data = []
        for item in dataset:
            data.append({
                "instruction": item.get("instruction", ""),
                "output": item.get("output", ""),
                "category": "python_code"
            })
        
        ts_path = save_as_typescript("python_alpaca", data, data[0] if data else {})
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["python_alpaca"] = {"samples": len(data), "source": "Vezora/Python-Alpaca"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def download_commit_messages():
    print("\n📥 Downloading Commit Messages...")
    try:
        dataset = load_dataset("Nan-Do/code-commit-messages", split="train", streaming=True)
        data = []
        count = 0
        for item in dataset:
            if count >= 5000:
                break
            data.append({
                "code": str(item.get("before", "") or item.get("code", "")),
                "message": str(item.get("message", "") or item.get("commit_message", "")),
                "category": "commit_message"
            })
            count += 1
        
        ts_path = save_as_typescript("commit_messages", data, data[0] if data else {})
        print(f"   ✅ Downloaded {len(data)} samples")
        
        MANIFEST["datasets"]["commit_messages"] = {"samples": len(data), "source": "Nan-Do/code-commit-messages"}
        MANIFEST["total_samples"] += len(data)
        return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []

def save_manifest():
    MANIFEST["downloaded_at"] = datetime.now().isoformat()
    with open(MANIFEST_PATH, "w") as f:
        json.dump(MANIFEST, f, indent=2)
    print(f"\n📋 Manifest updated")

def main():
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║       KAI AGENT - ADDITIONAL DATA DOWNLOAD                   ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")
    
    download_cybersecurity_eval()
    download_humaneval()
    download_mbpp()
    download_alpaca()
    download_python_alpaca()
    download_commit_messages()
    
    save_manifest()
    
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob("*") if f.is_file())
    
    print(f"\n╔══════════════════════════════════════════════════════════════╗")
    print(f"║  Total Datasets:    {len(MANIFEST['datasets']):<10}                           ║")
    print(f"║  Total Samples:     {MANIFEST['total_samples']:<10}                           ║")
    print(f"║  Total Size:        {total_size / 1024 / 1024:.2f} MB                          ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

if __name__ == "__main__":
    main()
