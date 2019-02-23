import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { async as glob } from 'fast-glob';
import { storiesTransformer } from '../..';
import { print } from 'util';

function resolveFixtureDirectory(fixtureDirectory: string): string {
  return path.resolve(__dirname, '../fixtures', fixtureDirectory);
}

export async function compile(fixtureDirectory: string): Promise<void> {
  const directory = resolveFixtureDirectory(fixtureDirectory);
  const files = await glob(`${directory}/**/*.ts`, { onlyFiles: true });

  const compilerOptions: ts.CompilerOptions = {
    strict: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015,
    lib: ['es2015', 'dom'],
    jsx: ts.JsxEmit.React,
    outDir: path.resolve(directory, '.artifacts'),
  };
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram(
    files.map((f) => f.toString()),
    compilerOptions,
    compilerHost,
  );

  program.emit(undefined, undefined, undefined, undefined, {
    before: [storiesTransformer()],
  });
}

export class DirectoryContent {
  public static async read(directory: string): Promise<DirectoryContent> {
    const files = await glob(`${path.resolve(directory)}/**`, {
      onlyFiles: true,
    });

    const directoryContent = new this(directory);
    const { _map } = directoryContent;
    await Promise.all(
      files.map(async (file) => {
        const filePath = file.toString();
        _map.set(
          path.relative(directory, file.toString()),
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
    for (const [filepath, content] of this._map.entries()) {
      chunks[i] = `//${filepath}\n${content}`;
      ++i;
    }
    return chunks.join('\n\n');
  }
}

export async function extractArtifacts(
  fixtureDirectory: string,
): Promise<DirectoryContent> {
  const artifactsDirectory = path.resolve(
    resolveFixtureDirectory(fixtureDirectory),
    '.artifacts',
  );

  return DirectoryContent.read(artifactsDirectory);
}
