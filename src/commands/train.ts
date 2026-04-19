/**
 * Train Command - Kai Agent Training CLI
 * 
 * Usage: kai train [options]
 * 
 * Options:
 *   --epochs <n>       Number of training epochs (default: 100)
 *   --batch <n>        Batch size (default: 32)
 *   --validation <n>  Validation split ratio (default: 0.1)
 *   --checkpoint <n>   Checkpoint interval (default: 5)
 *   --quantize         Enable weight quantization
 *   --bits <n>         Quantization bits (8, 16, 32)
 *   --output <dir>     Output directory for weights
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { TrainingPipeline } from '../training/TrainingPipeline';
import { WeightGenerator, QuantizationConfig } from '../training/WeightGenerator';

// ============================================================================
// TRAIN COMMAND
// ============================================================================

export function registerTrainCommand(program: Command): void {
  program
    .command('train')
    .description('Train Kai Agent brain with HuggingFace data')
    .option('--epochs <n>', 'Number of epochs', '100')
    .option('--batch <n>', 'Batch size', '32')
    .option('--validation <n>', 'Validation split', '0.1')
    .option('--checkpoint <n>', 'Checkpoint interval', '5')
    .option('--quantize', 'Enable quantization', false)
    .option('--bits <n>', 'Quantization bits', '16')
    .option('--output <dir>', 'Output directory', './weights')
    .option('--resume <epoch>', 'Resume from checkpoint epoch')
    .option('--quick', 'Quick training (10 epochs)', false)
    .action(async (options) => {
      await runTraining(options);
    });
}

async function runTraining(options: any): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🧠 KAI AGENT TRAINING PIPELINE 🧠                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Parse options
  const epochs = options.quick ? 10 : parseInt(options.epochs);
  const batchSize = parseInt(options.batch);
  const validationSplit = parseFloat(options.validation);
  const checkpointInterval = parseInt(options.checkpoint);
  const quantize = options.quantize;
  const bits = parseInt(options.bits) as 8 | 16 | 32;
  const outputDir = options.output;
  const resumeEpoch = options.resume ? parseInt(options.resume) : null;
  
  console.log('📋 Configuration:');
  console.log(`   Epochs: ${epochs}`);
  console.log(`   Batch Size: ${batchSize}`);
  console.log(`   Validation: ${validationSplit * 100}%`);
  console.log(`   Checkpoints: every ${checkpointInterval} epochs`);
  console.log(`   Quantization: ${quantize ? `${bits}-bit` : 'disabled'}`);
  console.log(`   Output: ${outputDir}\n`);
  
  // Create pipeline
  const pipeline = new TrainingPipeline('./data', './checkpoints', outputDir);
  
  try {
    // Initialize
    await pipeline.initialize();
    
    // Create networks
    console.log('\n🏗️ Creating Neural Networks...');
    pipeline.createBrainNetwork();
    pipeline.createCodingNetwork();
    pipeline.createSecurityNetwork();
    
    // Resume from checkpoint if specified
    if (resumeEpoch) {
      console.log(`\n📂 Resuming from checkpoint epoch ${resumeEpoch}...`);
      await pipeline.loadCheckpoint(resumeEpoch);
    }
    
    // Handle progress events
    pipeline.on('progress', (progress) => {
      const pct = ((progress.epoch + progress.batch / progress.totalBatches) / progress.totalEpochs * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${pct}% | Epoch ${progress.epoch + 1}/${progress.totalEpochs} | Batch ${progress.batch}/${progress.totalBatches} | Loss: ${progress.loss.toFixed(4)}`);
    });
    
    pipeline.on('epoch', (data) => {
      process.stdout.write('\n');
    });
    
    // Run training
    console.log('\n🚀 Starting Training Loop...\n');
    const report = await pipeline.train(epochs, batchSize, validationSplit, checkpointInterval);
    
    // Generate optimized weights
    console.log('\n🔧 Generating Model Weights...\n');
    const weightGen = new WeightGenerator(outputDir);
    
    const quantConfig: QuantizationConfig | undefined = quantize ? {
      bits,
      scheme: 'symmetric',
      perChannel: false
    } : undefined;
    
    // Get weights from neural engine
    const network = pipeline['neuralEngine'].getNetwork('kai-brain');
    if (network) {
      const state = network.getState();
      
      // Export in multiple formats
      const weightsFile = await weightGen.exportWeights(
        state.weights.map(w => new Float64Array(w)),
        state.biases,
        'final',
        'compressed',
        quantize,
        quantConfig
      );
      
      // Also export uncompressed JSON
      const jsonFile = await weightGen.exportWeights(
        state.weights.map(w => new Float64Array(w)),
        state.biases,
        'final',
        'json',
        false
      );
      
      console.log(`\n📄 Weights Files:`);
      console.log(`   Compressed: ${weightsFile}`);
      console.log(`   JSON: ${jsonFile}`);
    }
    
    // Save training report
    const reportFile = path.join(outputDir, 'training-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📊 Report: ${reportFile}`);
    
    // Final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ TRAINING COMPLETE ✅                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📈 Final Results:');
    console.log(`   Duration: ${(report.durationMs / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Samples Trained: ${report.totalSamples.toLocaleString()}`);
    console.log(`   Final Loss: ${report.finalLoss.toFixed(6)}`);
    console.log(`   Final Accuracy: ${(report.finalAccuracy * 100).toFixed(2)}%`);
    console.log(`   Best Loss: ${report.bestLoss.toFixed(6)}`);
    console.log(`   Best Accuracy: ${(report.bestAccuracy * 100).toFixed(2)}%`);
    console.log(`   Checkpoints: ${report.checkpoints}`);
    
    // Shutdown
    pipeline.shutdown();
    
  } catch (error) {
    console.error('\n❌ Training Error:', error);
    process.exit(1);
  }
}

export default registerTrainCommand;
