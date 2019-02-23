import * as fc from 'fast-check';
import * as path from 'path';

import { defaultPathToKind } from '../path-to-kind';

function nonPathString(): fc.Arbitrary<string> {
  return fc.unicodeString().filter((str) => {
    const normalizedStr = path.normalize(str);
    const { base } = path.parse(normalizedStr);
    return base === normalizedStr;
  });
}

describe('defaultPathToKind()', () => {
  it('removes the suffix and extension from the file name and returns the full path', () => {
    fc.assert(
      fc.property(
        fc.array(nonPathString()),
        nonPathString().filter(
          (str) => !(str === '' || str === 'index' || str.includes('.')),
        ),
        nonPathString(),
        (dirs, name, suffix) => {
          const defaultKind = path.join(...dirs, name);
          expect(defaultPathToKind(defaultKind)).toBe('');
          expect(defaultPathToKind(`${defaultKind}.ts`)).toBe('');
          expect(defaultPathToKind(`${defaultKind}.${suffix}`)).toBe('');
          expect(defaultPathToKind(`${defaultKind}.${suffix}.ts`)).toBe('');
        },
      ),
    );
  });
  it('returns an empty string when the path does not appear to be a file', () => {
    expect(defaultPathToKind('')).toBe('');
    expect(defaultPathToKind('/')).toBe('');
    expect(defaultPathToKind('./.')).toBe('');
    expect(defaultPathToKind('//')).toBe('');
    expect(defaultPathToKind('/./')).toBe('');
  });
  it('returns the unnamed kind when the path appears to be a single file whose base name is index', () => {
    expect(defaultPathToKind(`index`)).toBe('');
    expect(defaultPathToKind(`index.ts`)).toBe('');
    expect(defaultPathToKind(`./index`)).toBe('');
    expect(defaultPathToKind(`./index.ts`)).toBe('');
    expect(defaultPathToKind(`./index`)).toBe('');
    expect(defaultPathToKind(`./foo/.././index`)).toBe('');
    expect(defaultPathToKind(`./foo/.././index.ts`)).toBe('');
  });
  it('returns the unnamed kind when the path appears to be a single file whose base name is index, followed by a suffix', () => {
    fc.assert(
      fc.property(nonPathString(), (suffix) => {
        expect(defaultPathToKind(`index.${suffix}`)).toBe('');
        expect(defaultPathToKind(`index.${suffix}.ts`)).toBe('');
        expect(defaultPathToKind(`./index.${suffix}`)).toBe('');
        expect(defaultPathToKind(`./index.${suffix}.ts`)).toBe('');
        expect(defaultPathToKind(`./foo/.././index.${suffix}`)).toBe('');
        expect(defaultPathToKind(`./foo/.././index.${suffix}.ts`)).toBe('');
      }),
    );
  });
});
