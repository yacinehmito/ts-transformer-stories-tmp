import { normalize, parse, join } from 'path';

function isTruthy(arg: unknown): boolean {
  return Boolean(arg);
}

/**
 * @public
 * Type of functions that can be provided to {@link StoriesTransformerOptions.pathToKind}.
 * @param filePath The path of the file that is being transformed
 * @param defaultKind The name of the kind returned by the default `pathToKind` for the provided file path
 * @returns The name that will be given to the kind defined in the file that is being transformed
 */
export type PathToKindFunction = (filePath: string) => string;

/**
 * @public
 * Removes the extension and suffix from the file path, then further removes the base name if it is `'index'`.
 * Default value of {@link StoriesTransformerOptions.pathToKind} when passed to {@link storiesTransformer}.
 * @param filePath The path of the file being transformed, relative to {@link StoriesTransformerOptions.rootDir}
 * @returns A string that will be the name of the kind for the given file
 */
export function defaultPathToKind(filePath: string): string {
  const { name, dir } = parse(normalize(filePath));
  if (!name) return '';
  const nameWithoutSuffix = name.split('.').find(isTruthy);
  if (!nameWithoutSuffix || nameWithoutSuffix === 'index') {
    return dir || '';
  }
  return join(dir, nameWithoutSuffix);
}
