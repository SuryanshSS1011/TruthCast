/**
 * Script Runner - replaces OpenClaw for file-based agent execution
 */

import { spawn } from 'child_process';
import { join } from 'path';

export interface ScriptRunnerOptions {
  scriptName: string;
  pipelineDir: string;
  env?: Record<string, string>;
  timeout?: number;
}

export async function runScript(options: ScriptRunnerOptions): Promise<string> {
  const { scriptName, pipelineDir, env = {}, timeout = 300000 } = options;

  const scriptPath = join(process.cwd(), 'packages/pipeline/scripts', `${scriptName}.ts`);

  console.log(`[ScriptRunner] Starting ${scriptName} script...`);
  console.log(`[ScriptRunner] Script path: ${scriptPath}`);
  console.log(`[ScriptRunner] Pipeline dir: ${pipelineDir}`);

  return new Promise((resolve, reject) => {
    const scriptEnv = {
      ...process.env,
      PIPELINE_DIR: pipelineDir,
      ...env,
    };

    const proc = spawn('npx', ['tsx', scriptPath], {
      env: scriptEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let ended = false;

    const timeoutHandle = setTimeout(() => {
      if (!ended) {
        proc.kill();
        reject(new Error(`[ScriptRunner] ${scriptName} script timed out after ${timeout}ms`));
      }
    }, timeout);

    proc.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      process.stdout.write(chunk);

      if (chunk.includes('[END]')) {
        ended = true;
        clearTimeout(timeoutHandle);
        proc.kill();
      }
    });

    proc.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      process.stderr.write(chunk);
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutHandle);

      if (ended) {
        console.log(`[ScriptRunner] ${scriptName} script completed successfully`);
        resolve(stdout);
      } else if (code === 0) {
        console.warn(`[ScriptRunner] ${scriptName} script exited without [END] marker`);
        resolve(stdout);
      } else {
        reject(new Error(`[ScriptRunner] ${scriptName} script failed with code ${code}\nstderr: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`[ScriptRunner] Failed to spawn ${scriptName} script: ${err.message}`));
    });
  });
}
