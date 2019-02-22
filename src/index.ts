/**
 * @packageDocumentation
 * ts-transformer-stories is a TypeScript transformer that removes some of Storybook's boilerplate code
 * and produces a hierarchy of stories that matches the hierarchy of files and directories.
 */

import * as ts from 'typescript';
import { relative } from 'path';
import { PathToKindFunction, defaultPathToKind } from './path-to-kind';

/**
 * @public
 * Options for the transformer factory
 */
export interface StoriesTransformerOptions {
  /**
   * The name of the module that will be replaced by the kind,
   * i.e. the object which stories are added to.
   * Defaults to `'stories'`.
   * @example
   * // If storiesModule is set to 'foo', the stories builder must be imported like this:
   * import stories from 'foo';
   */
  storiesModule?: string;
  /**
   * The storybook module used to create the kind.
   * It depends on the library you are using.
   * Defaults to `'@storybook/react'`.
   */
  storybookModule?: string;
  /**
   * The function used to determine the name of a kind from its file path.
   * Defaults to a function that removes the extension and suffix from the file path,
   * then further removes the base name if it is `'index'`.
   */
  pathToKind?: PathToKindFunction;
  /**
   * The placeholder for when the kind given by `pathToKind` is an empty string.
   * Defaults to `'Unnamed'`.
   */
  unnamedKind?: string;
  /**
   * The regular expression that identifies the files that must be transformed.
   * Defaults to `/\.stories\.tsx?$/`.
   */
  pattern?: RegExp;
  /**
   * The directory relative to which the file paths are set.
   * Defaults to the current working directory.
   */
  rootDir?: string;
}

/**
 * @public
 * Creates the transformer factory that replaces the stories module
 * with an automatically generated story builder.
 * @param options
 * @returns The transformer factory
 */
export function storiesTransformer(
  options: StoriesTransformerOptions = {},
): ts.TransformerFactory<ts.SourceFile> {
  const {
    storiesModule = 'stories',
    storybookModule = '@storybook/react',
    pathToKind = defaultPathToKind,
    unnamedKind = 'Unnamed',
    pattern = /\.stories\.tsx?$/,
    rootDir = process.cwd(),
  } = options;

  function transformerFactory(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.SourceFile> {
    return function transformer(file: ts.SourceFile): ts.SourceFile {
      const filePath = file.fileName;
      if (pattern && !pattern.test(filePath)) {
        return file;
      }
      const kind = pathToKind(relative(rootDir, filePath)) || unnamedKind;
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

type StoriesImport = ts.ImportDeclaration & {
  importClause: ts.ImportClause & { name: string };
};

function isStoriesImport(
  node: ts.Node,
  storiesModule: string,
): node is StoriesImport {
  if (ts.isImportDeclaration(node)) {
    const { moduleSpecifier, importClause } = node;
    if (
      moduleSpecifier &&
      ts.isStringLiteral(moduleSpecifier) &&
      moduleSpecifier.text === storiesModule &&
      importClause
    ) {
      return ts.isImportClause(importClause) && Boolean(importClause.name);
    }
  }
  return false;
}

function buildStoriesOfImport(
  storiesOfIdentifier: ts.Identifier,
  storybookModule: string,
): ts.ImportDeclaration {
  return ts.createImportDeclaration(
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
}

function buildKindInstantiation(
  storiesIdentifier: ts.Identifier,
  storiesOfIdentifier: ts.Identifier,
  kind: string,
): ts.VariableStatement {
  return ts.createVariableStatement(
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
    if (isStoriesImport(node, storiesModule) && !storiesIdentifier) {
      const { importClause } = node;
      storiesIdentifier = ts.createIdentifier(importClause.name.text);
      return buildStoriesOfImport(storiesOfIdentifier, storybookModule);
    }

    // Before the first non-import node, write:
    //   const <storiesIdentifier> = <storiesOfIdentifier>(<kind>, module);
    // e.g.:
    //   const stories = storiesOf_unique('MyComponent', module);
    if (!ts.isImportDeclaration(node) && storiesIdentifier) {
      visitNode = (node) => node;
      const kindInstantiation = buildKindInstantiation(
        storiesIdentifier,
        storiesOfIdentifier,
        kind,
      );
      return [kindInstantiation, node];
    }

    return node;
  };

  return ts.visitEachChild(sourceFile, visitNode, context);
}

export { PathToKindFunction, defaultPathToKind } from './path-to-kind';
