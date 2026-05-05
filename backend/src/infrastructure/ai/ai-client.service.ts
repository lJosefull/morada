import { Injectable } from '@nestjs/common';
import { AiService } from '../../application/ai/ai.service';
import { AiPropertyInput, AiPropertyOutput } from '../../domain/ai/ai.types';
import { spawn } from 'child_process';
import { resolve } from 'path';

@Injectable()
export class AiClientService implements AiService {
  private readonly pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = resolve(__dirname, '../../../../main.py');
  }

  async enhanceProperty(input: AiPropertyInput): Promise<AiPropertyOutput> {
    return new Promise((resolvePromise, reject) => {
      const pythonProcess = spawn('python', [this.pythonScriptPath], {
        timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '60000'),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code: number | null) => {
        if (code !== 0) {
          console.error('AI service stderr:', stderr);
          reject(new Error(`AI process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolvePromise({
            optimizedTitle: result.optimizedTitle || input.title,
            improvedDescription: result.improvedDescription || input.description,
            qualityScore: result.qualityScore || 7.0,
            suggestions: result.suggestions || [],
          });
        } catch (e) {
          reject(new Error(`Failed to parse AI output: ${stdout}`));
        }
      });

      pythonProcess.on('error', (err: Error) => {
        reject(new Error(`Failed to start AI process: ${err.message}`));
      });

      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();
    });
  }
}
