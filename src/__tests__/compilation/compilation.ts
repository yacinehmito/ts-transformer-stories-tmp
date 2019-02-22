import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { async as glob } from 'fast-glob';
import { storiesTransformer } from '../..';

function resolveInRoot(...args: string[]): string {
  return path.resolve(__dirname, '../../..', ...args);
}

function resolveFixtureDirectory(fixtureDirectory: string): string {
  return path.resolve(__dirname, 'fixtures', fixtureDirectory);
}

function resolveCompilationArtifactsDirectory(
  fixtureDirectory: string,
): string {
  return resolveInRoot('.temp/test-artifacts/compilation', fixtureDirectory);
}

export async function compile(fixtureDirectory: string): Promise<void> {
  const directory = resolveFixtureDirectory(fixtureDirectory);
  const files = await glob(`${directory}/**/*.{ts,tsx}`, { onlyFiles: true });

  const compilerOptions: ts.CompilerOptions = {
    strict: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015,
    lib: ['es2015', 'dom'],
    jsx: ts.JsxEmit.React,
    outDir: resolveCompilationArtifactsDirectory(fixtureDirectory),
  };
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram(
    files.map((f) => f.toString()),
    compilerOptions,
    compilerHost,
  );

  program.emit(undefined, undefined, undefined, undefined, {
    before: [storiesTransformer({ rootDir: directory })],
  });
}

function compareTupleByFirstElement<T extends string | number | boolean>(
  [a]: [T, ...unknown[]],
  [b]: [T, ...unknown[]],
): number {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}
export class DirectoryContent {
  public static async read(directory: string): Promise<DirectoryContent> {
    const files = await glob(`${path.resolve(directory)}/**`, {
      onlyFiles: true,
    });

    const directoryContent = new this(directory);
    const { _map } = directoryContent;
    await Promise.all(
      files
        .map((file) => file.toString())
        .sort()
        .map(async (filePath) => {
          _map.set(
            path.relative(directory, filePath),
            await fs.readFile(filePath, { encoding: 'utf8' }),
          );
        }),
    );

    return directoryContent;
  }

  public static getSnapshotSerializer(): jest.SnapshotSerializerPlugin {
    const DirectoryContent = this;
    return {
      test(arg: unknown): boolean {
        return arg instanceof DirectoryContent;
      },
      print(arg: unknown): string {
        const directoryContent = arg as DirectoryContent;
        return directoryContent.toString();
      },
    };
  }

  public readonly directory: string;
  private _map: Map<string, string>;

  private constructor(directory: string) {
    this.directory = directory;
    this._map = new Map();
  }

  public toString(): string {
    const chunks: string[] = new Array(this._map.size);
    let i = 0;
    const entries = Array.from(this._map.entries()).sort(
      compareTupleByFirstElement,
    );
    for (const [filePath, content] of entries) {
      chunks[i] = `----boundary ${filePath}\n${content}`;
      ++i;
    }
    return chunks.join('\n');
  }
}

export async function extractArtifacts(
  fixtureDirectory: string,
): Promise<DirectoryContent> {
  const artifactsDirectory = resolveCompilationArtifactsDirectory(
    fixtureDirectory,
  );

  return DirectoryContent.read(artifactsDirectory);
}
