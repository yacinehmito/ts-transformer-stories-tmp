#!/usr/bin/env ts-node -P ./scripts/tsconfig.json

import { resolve } from 'path';
import { exec } from 'child_process';

function resolveInRoot(...args: string[]): string {
  return resolve(__dirname, '..', ...args);
}

async function execute(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdin, stdout) => {
      process.stdin.write(stdin);
      process.stdin.write(stdout);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function main(): Promise<void> {
  try {
    await execute(`tsc --project ${resolveInRoot('./tsconfig.build.json')}`);
    await execute('api-extractor run');
  } catch (error) {
    // Silence all errors
  }
}

main();
