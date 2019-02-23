#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

const { resolve } = require('path');
const { readFileSync } = require('fs');
const typescript = require('typescript');
const rollup = require('rollup');
const { terser } = require('rollup-plugin-terser');
const rollupTypescript = require('rollup-plugin-typescript2');

function rootResolve(...args) {
  return resolve(__dirname, '..', ...args);
}

const packageJson = JSON.parse(readFileSync(rootResolve('./package.json')));

async function build(configOverload = {}) {
  const { plugins = [], suffix = '' } = configOverload;
  const bundle = await rollup.rollup({
    input: 'src/index.ts',
    external: [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ],
    plugins: [
      rollupTypescript({
        typescript,
        cacheRoot: rootResolve('./temp/rpt2_cache'),
      }),
      ...plugins,
    ],
  });

  await Promise.all([
    bundle.write({
      file: `./dist/index${suffix}.js`,
      format: 'umd',
      name: 'TsTransformerStories',
    }),
    bundle.write({
      file: `./dist/index${suffix}.mjs`,
      format: 'esm',
    }),
  ]);
}

build();
build({ suffix: '.min', plugins: [terser()] });
