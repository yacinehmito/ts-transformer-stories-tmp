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
        fc.unicodeString(),
        (dirs, name, suffix, unnamedKind) => {
          const defaultKind = path.join(...dirs, name);
          expect(defaultPathToKind(defaultKind, unnamedKind)).toBe(defaultKind);
          expect(defaultPathToKind(`${defaultKind}.ts`, unnamedKind)).toBe(
            defaultKind,
          );
          expect(
            defaultPathToKind(`${defaultKind}.${suffix}`, unnamedKind),
          ).toBe(defaultKind);
          expect(
            defaultPathToKind(`${defaultKind}.${suffix}.ts`, unnamedKind),
          ).toBe(defaultKind);
        },
      ),
    );
  });
  it('returns the unnamed kind when the path does not appear to be a file', () => {
    fc.assert(
      fc.property(fc.unicodeString(), (unnamedKind) => {
        expect(defaultPathToKind('', unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind('/', unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind('./.', unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind('//', unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind('/./', unnamedKind)).toBe(unnamedKind);
      }),
    );
  });
  it('returns the unnamed kind when the path appears to be a single file whose base name is index', () => {
    fc.assert(
      fc.property(fc.unicodeString(), (unnamedKind) => {
        expect(defaultPathToKind(`index`, unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind(`index.ts`, unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind(`./index`, unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind(`./index.ts`, unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind(`./index`, unnamedKind)).toBe(unnamedKind);
        expect(defaultPathToKind(`./foo/.././index`, unnamedKind)).toBe(
          unnamedKind,
        );
        expect(defaultPathToKind(`./foo/.././index.ts`, unnamedKind)).toBe(
          unnamedKind,
        );
      }),
    );
  });
  it('returns the unnamed kind when the path appears to be a single file whose base name is index, followed by a suffix', () => {
    fc.assert(
      fc.property(
        fc.unicodeString(),
        nonPathString(),
        (unnamedKind, suffix) => {
          expect(defaultPathToKind(`index.${suffix}`, unnamedKind)).toBe(
            unnamedKind,
          );
          expect(defaultPathToKind(`index.${suffix}.ts`, unnamedKind)).toBe(
            unnamedKind,
          );
          expect(defaultPathToKind(`./index.${suffix}`, unnamedKind)).toBe(
            unnamedKind,
          );
          expect(defaultPathToKind(`./index.${suffix}.ts`, unnamedKind)).toBe(
            unnamedKind,
          );
          expect(
            defaultPathToKind(`./foo/.././index.${suffix}`, unnamedKind),
          ).toBe(unnamedKind);
          expect(
            defaultPathToKind(`./foo/.././index.${suffix}.ts`, unnamedKind),
          ).toBe(unnamedKind);
        },
      ),
    );
  });
});
