import { normalize, parse, join } from 'path';

function isTruthy(arg: unknown): boolean {
  return Boolean(arg);
}

export type PathToKindFunction = (
  filePath: string,
  unnamedKind: string,
  defaultKind: string,
) => string;

export function defaultPathToKind(
  filePath: string,
  unnamedKind: string,
): string {
  const { name, dir } = parse(normalize(filePath));
  if (!name) return unnamedKind;
  const nameWithoutSuffix = name.split('.').find(isTruthy);
  if (!nameWithoutSuffix || nameWithoutSuffix === 'index') {
    return dir || unnamedKind;
  }
  return join(dir, nameWithoutSuffix);
}
