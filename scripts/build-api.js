#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

// Testing out some stuff

const { resolve: pathResolve } = require('path');
const { exec } = require('child_process');

function resolve(...args) {
  return pathResolve(__dirname, '..', ...args);
}

async function execute(command) {
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

async function main() {
  try {
    await execute(`tsc --project ${resolve('./tsconfig.build.json')}`);
    await execute('api-extractor run');
  } catch (error) {
    // Silence all errors
  }
}

main();
