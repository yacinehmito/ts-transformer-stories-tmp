#!/usr/bin/env ts-node

import { resolve } from 'path';
import { readFileSync } from 'fs';
import { camelCase } from 'change-case';
import * as typescript from 'typescript';
import * as rollup from 'rollup';
import { terser } from 'rollup-plugin-terser';
import rollupTypescript from 'rollup-plugin-typescript2';

function resolveInRoot(...args: string[]): string {
  return resolve(__dirname, '..', ...args);
}

process.chdir(resolveInRoot('./.'));

interface PackageJson {
  name: string;
  dependencies: { [name: string]: string };
  peerDependencies: { [name: string]: string };
}

interface BuildOptions {
  external?: string[];
}

async function build(
  packageJson: PackageJson,
  options: BuildOptions = {},
): Promise<void> {
  const { external = [] } = options;

  const config = {
    input: resolveInRoot('./src/index.ts'),
    external: [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
      ...external,
    ],
    plugins: [
      rollupTypescript({
        typescript,
        cacheRoot: resolveInRoot('./.temp/rpt2_cache'),
        tsconfig: resolveInRoot('./tsconfig.json'),
      }),
    ],
  };
  const bundle = await rollup.rollup(config);
  const minifiedBundle = await rollup.rollup({
    ...config,
    plugins: [...config.plugins, terser()],
  });

  const umdOutput: rollup.OutputOptions = {
    file: resolveInRoot('./dist/index.js'),
    format: 'umd',
    name: camelCase(packageJson.name),
    globals: {
      path: 'path',
      typescript: 'ts',
    },
  };

  await Promise.all([
    bundle.write(umdOutput),
    minifiedBundle.write({
      ...umdOutput,
      file: resolveInRoot('./dist/index.min.js'),
    }),
    bundle.write({
      file: resolveInRoot('./dist/index.mjs'),
      format: 'esm',
    }),
  ]);
}

build(
  JSON.parse(
    readFileSync(resolveInRoot('./package.json'), { encoding: 'utf8' }),
  ),
  { external: ['path'] },
);
