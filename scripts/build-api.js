#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

const { resolve: pathResolve } = require('path');
const { execSync: exec } = require('child_process');

function resolve(...args) {
  return pathResolve(__dirname, '..', ...args);
}

exec(`tsc --project ${resolve('./tsconfig.build.json')}`);
exec(`api-extractor run`);
