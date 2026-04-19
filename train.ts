#!/usr/bin/env bun
/**
 * Kai Agent Quick Start Training Script
 * 
 * Start training with 1 click: bun run train.ts
 * 
 * This script:
 * 1. Loads all HuggingFace data (393K+ samples)
 * 2. Creates the neural brain network
 * 3. Runs training loop
 * 4. Generates model weights
 */

import * as fs from 'fs';
import * as path from 'path';
import { TrainingPipeline } from './src/training/TrainingPipeline';
import { WeightGenerator } from './src/training/WeightGenerator';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  epochs: 50,              // Training epochs
  batchSize: 64,           // Batch size
  validationSplit: 0.1,    // 10% for validation
  checkpointInterval: 5,   // Save checkpoint every 5 epochs
  quantize: true,          // Enable quantization
  bits: 16 as 8 | 16 | 32, // 16-bit quantization
  outputDir: './weights',
  dataDir: './data'
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    █████╗ ██╗██████╗  ██████╗ ██╗  ██╗                               ║
║   ██╔══██╗██║██╔══██╗██╔═══██╗╚██╗██╔╝                               ║
║   ███████║██║██████╔╝██║   ██║ ╚███╔╝                                ║
║   ██╔══██║██║██╔══██╗██║   ██║ ██╔██╗                                ║
║   ██║  ██║██║██║  ██║╚██████╔╝██╔╝ ██╗                               ║
║   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝                               ║
║                                                                      ║
║              🧠 NEURAL AI BRAIN TRAINING 🧠                          ║
║                                                                      ║
║    Memory Brain + Tree of Thoughts + Cell Architecture              ║
║    Powered by 393,000+ HuggingFace Coding Samples                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  console.log('📋 Training Configuration:');
  console.log('─'.repeat(50));
  console.log(`   Epochs: ${CONFIG.epochs}`);
  console.log(`   Batch Size: ${CONFIG.batchSize}`);
  console.log(`   Validation: ${CONFIG.validationSplit * 100}%`);
  console.log(`   Quantization: ${CONFIG.bits}-bit`);
  console.log(`   Output: ${CONFIG.outputDir}`);
  console.log('');

  // Create directories
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync('./checkpoints', { recursive: true });

  // Create training pipeline
  const pipeline = new TrainingPipeline(
    CONFIG.dataDir,
    './checkpoints',
    CONFIG.outputDir
  );

  // Progress tracking
  let lastProgress = '';
  pipeline.on('progress', (progress) => {
    const pct = ((progress.epoch + progress.batch / progress.totalBatches) / progress.totalEpochs * 100).toFixed(1);
    const status = `   [${pct}%] Epoch ${progress.epoch + 1}/${progress.totalEpochs} | Batch ${progress.batch}/${progress.totalBatches} | Loss: ${progress.loss.toFixed(4)}`;
    if (status !== lastProgress) {
      process.stdout.write(`\r${status}`);
      lastProgress = status;
    }
  });

  pipeline.on('epoch', (data) => {
    console.log(`\n   ✓ Epoch ${data.epoch} complete: loss=${data.loss.toFixed(4)}, accuracy=${(data.accuracy * 100).toFixed(1)}%`);
  });

  try {
    // Step 1: Initialize and load data
    console.log('\n⏳ Step 1: Loading HuggingFace Data...\n');
    await pipeline.initialize();

    // Step 2: Create neural networks
    console.log('\n🏗️ Step 2: Creating Neural Networks...\n');
    pipeline.createBrainNetwork();
    console.log('   ✓ Main brain network created');
    
    pipeline.createCodingNetwork();
    console.log('   ✓ Coding network created');
    
    pipeline.createSecurityNetwork();
    console.log('   ✓ Security network created');

    // Step 3: Run training
    console.log('\n🚀 Step 3: Training Neural Brain...\n');
    console.log('─'.repeat(50));
    
    const report = await pipeline.train(
      CONFIG.epochs,
      CONFIG.batchSize,
      CONFIG.validationSplit,
      CONFIG.checkpointInterval
    );

    // Step 4: Generate weights
    console.log('\n\n🔧 Step 4: Generating Model Weights...\n');
    
    const weightGen = new WeightGenerator(CONFIG.outputDir);
    const network = pipeline['neuralEngine'].getNetwork('kai-brain');
    
    if (network) {
      const state = network.getState();
      
      // Export compressed weights
      const compressedFile = await weightGen.exportWeights(
        state.weights.map(w => new Float64Array(w)),
        state.biases,
        'kai-brain-final',
        'compressed',
        CONFIG.quantize,
        { bits: CONFIG.bits, scheme: 'symmetric', perChannel: false }
      );
      
      // Export JSON weights
      const jsonFile = await weightGen.exportWeights(
        state.weights.map(w => new Float64Array(w)),
        state.biases,
        'kai-brain-final',
        'json',
        false
      );
      
      console.log(`\n   ✓ Compressed: ${compressedFile}`);
      console.log(`   ✓ JSON: ${jsonFile}`);
    }

    // Step 5: Save report
    const reportPath = path.join(CONFIG.outputDir, 'training-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      ...report,
      config: CONFIG,
      completedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(`   ✓ Report: ${reportPath}`);

    // Final summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║              ✅ TRAINING COMPLETE ✅                     ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📊 Final Results:\n');
    console.log(`   Duration: ${(report.durationMs / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Samples: ${report.totalSamples.toLocaleString()}`);
    console.log(`   Final Loss: ${report.finalLoss.toFixed(6)}`);
    console.log(`   Final Accuracy: ${(report.finalAccuracy * 100).toFixed(2)}%`);
    console.log(`   Best Loss: ${report.bestLoss.toFixed(6)}`);
    console.log(`   Best Accuracy: ${(report.bestAccuracy * 100).toFixed(2)}%`);
    console.log(`   Checkpoints: ${report.checkpoints}`);
    console.log('\n📁 Output Files:');
    console.log(`   Weights: ${CONFIG.outputDir}/`);
    console.log(`   Checkpoints: ./checkpoints/`);
    console.log('\n🎯 Next Steps:');
    console.log('   1. Run: bun run src/start.ts');
    console.log('   2. Use the trained brain for coding and security tasks');
    console.log('');

    // Cleanup
    pipeline.shutdown();

  } catch (error) {
    console.error('\n❌ Training Error:', error);
    process.exit(1);
  }
}

// Run
main().catch(console.error);
