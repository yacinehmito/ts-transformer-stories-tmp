import * as ts from 'typescript';
import { PathToKindFunction, defaultPathToKind } from './path-to-kind';

export interface StoriesTransformerOptions {
  storiesModule?: string;
  storybookModule?: string;
  unnamedKind?: string;
  pathToKind?: PathToKindFunction;
  pattern?: RegExp;
}

function forwardDefaultKind(_: string, defaultKind: string): string {
  return defaultKind;
}

export function storiesTransformer(
  options: StoriesTransformerOptions = {},
): ts.TransformerFactory<ts.SourceFile> {
  const {
    storiesModule = 'stories',
    storybookModule = '@storybook/react',
    pathToKind = forwardDefaultKind,
    unnamedKind = 'Unnamed',
    pattern = /\.stories\.ts$/,
  } = options;

  function transformerFactory(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.SourceFile> {
    return function transformer(file: ts.SourceFile): ts.SourceFile {
      const filePath = file.fileName;

      if (pattern && !pattern.test(filePath)) {
        return file;
      }

      const defaultKind = defaultPathToKind(filePath, unnamedKind);
      const kind = pathToKind(filePath, unnamedKind, defaultKind);

      return visitSourceFile(file, context, {
        kind,
        storiesModule,
        storybookModule,
      });
    };
  }

  return transformerFactory;
}

interface VisitParameters {
  kind: string;
  storiesModule: string;
  storybookModule: string;
}

function visitSourceFile(
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext,
  { kind, storiesModule, storybookModule }: VisitParameters,
): ts.SourceFile {
  const storiesOfIdentifier = ts.createUniqueName('storiesOf');
  let storiesIdentifier: ts.Identifier;

  let visitNode = (node: ts.Node): ts.Node | ts.Node[] => {
    // Find declaration of the form:
    //   import <storiesIdentifier> from '<storiesModule>'
    // e.g.:
    //   import stories from 'stories'
    // Replace it with:
    //   import { storiesOf as <storiesOfIdentifier> } from '<storybookModule>'
    // e.g.:
    //   import { storiesOf as storiesOf_unique } from '@storybook/react'
    if (ts.isImportDeclaration(node) && !storiesIdentifier) {
      const { moduleSpecifier, importClause } = node;
      if (
        moduleSpecifier &&
        ts.isStringLiteral(moduleSpecifier) &&
        moduleSpecifier.text === storiesModule &&
        importClause &&
        ts.isImportClause(importClause)
      ) {
        if (importClause.name) {
          storiesIdentifier = ts.createIdentifier(importClause.name.text);

          const storiesOfImport = ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(
              undefined,
              ts.createNamedImports([
                ts.createImportSpecifier(
                  ts.createIdentifier('storiesOf'),
                  storiesOfIdentifier,
                ),
              ]),
            ),
            ts.createLiteral(storybookModule),
          );

          return storiesOfImport;
        }
      }
    }

    // Before the first non-import node, write:
    //   const <storiesIdentifier> = <storiesOfIdentifier>(<kind>, module);
    // e.g.:
    //   const stories = storiesOf_unique('MyComponent', module);
    if (!ts.isImportDeclaration(node) && storiesIdentifier) {
      visitNode = (node) => node;

      const storiesBuilderInstantiation = ts.createVariableStatement(
        undefined,
        ts.createVariableDeclarationList(
          [
            ts.createVariableDeclaration(
              storiesIdentifier,
              undefined,
              ts.createCall(
                storiesOfIdentifier,
                [],
                [ts.createLiteral(kind), ts.createIdentifier('module')],
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );
      return [storiesBuilderInstantiation, node];
    }

    return node;
  };

  return ts.visitEachChild(sourceFile, visitNode, context);
}

module.exports = { storiesTransformer };
