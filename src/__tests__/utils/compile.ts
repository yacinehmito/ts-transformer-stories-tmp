import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

function resolveFixtureDirectory(fixtureDirectory: string): string {
  return path.resolve(__dirname, '../fixtures', fixtureDirectory);
}

export async function compile(fixtureDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(
      `tsc --project ${path.join(
        resolveFixtureDirectory(fixtureDirectory),
        'tsconfig.json',
      )}`,
      (error, stdout, stderr) => {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}

export type DirectoryContent = { [filename: string]: string };

type FileType = 'file' | 'directory';

function getFileTypeFromStat(stats: fs.Stats): FileType | undefined {
  if (stats.isFile()) return 'file';
  if (stats.isDirectory()) return 'directory';
}

async function extractDirectoryContent(
  directory: string,
  relativeTo: string,
): Promise<DirectoryContent> {
  const content: DirectoryContent = Object.create(null);

  const filenames = await fs.readdir(directory);
  await Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(directory, filename);
      const stats = await fs.stat(filePath);
      const type = getFileTypeFromStat(stats);
      switch (type) {
        case 'file':
          const fileContent = await fs.readFile(filePath, { encoding: 'utf8' });
          content[path.relative(relativeTo, filePath)] = fileContent;
          break;
        case 'directory':
          const subDirectoryContent = await extractDirectoryContent(
            filePath,
            relativeTo,
          );
          Object.assign(content, subDirectoryContent);
          break;
        default:
          // Unknown type: cannot handle it
          break;
      }
    }),
  );

  return content;
}

export async function extractArtifacts(
  fixtureDirectory: string,
): Promise<DirectoryContent> {
  const artifactsDirectory = path.resolve(
    resolveFixtureDirectory(fixtureDirectory),
    '.artifacts',
  );
  const content = await extractDirectoryContent(
    artifactsDirectory,
    artifactsDirectory,
  );
  await fs.remove(artifactsDirectory);
  return content;
}
