/**
 * Shell utilities for Kai Agent
 */

export class Shell {
  static async execute(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { execSync } = require('child_process');
    try {
      const stdout = execSync(command, { encoding: 'utf-8' });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.status || 1
      };
    }
  }
}

export default Shell;