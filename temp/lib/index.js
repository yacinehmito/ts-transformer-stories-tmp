import * as ts from 'typescript';
import { relative } from 'path';
import { defaultPathToKind } from './path-to-kind';
function forwardDefaultKind(_, defaultKind) {
    return defaultKind;
}
/**
 * @public
 * Creates the transformer factory that replaces the stories module
 * with an automatically generated story builder.
 * @param options
 * @returns The transformer factory
 */
export function storiesTransformer(options = {}) {
    const { storiesModule = 'stories', storybookModule = '@storybook/react', pathToKind = forwardDefaultKind, unnamedKind = 'Unnamed', pattern = /\.stories\.tsx?$/, rootDir = process.cwd(), } = options;
    function transformerFactory(context) {
        return function transformer(file) {
            const filePath = file.fileName;
            if (pattern && !pattern.test(filePath)) {
                return file;
            }
            const relativeFilePath = relative(rootDir, filePath);
            const defaultKind = defaultPathToKind(relativeFilePath);
            const kind = pathToKind(relativeFilePath, defaultKind) || unnamedKind;
            return visitSourceFile(file, context, {
                kind,
                storiesModule,
                storybookModule,
            });
        };
    }
    return transformerFactory;
}
function visitSourceFile(sourceFile, context, { kind, storiesModule, storybookModule }) {
    const storiesOfIdentifier = ts.createUniqueName('storiesOf');
    let storiesIdentifier;
    let visitNode = (node) => {
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
            if (moduleSpecifier &&
                ts.isStringLiteral(moduleSpecifier) &&
                moduleSpecifier.text === storiesModule &&
                importClause &&
                ts.isImportClause(importClause)) {
                if (importClause.name) {
                    storiesIdentifier = ts.createIdentifier(importClause.name.text);
                    const storiesOfImport = ts.createImportDeclaration(undefined, undefined, ts.createImportClause(undefined, ts.createNamedImports([
                        ts.createImportSpecifier(ts.createIdentifier('storiesOf'), storiesOfIdentifier),
                    ])), ts.createLiteral(storybookModule));
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
            const storiesBuilderInstantiation = ts.createVariableStatement(undefined, ts.createVariableDeclarationList([
                ts.createVariableDeclaration(storiesIdentifier, undefined, ts.createCall(storiesOfIdentifier, [], [ts.createLiteral(kind), ts.createIdentifier('module')])),
            ], ts.NodeFlags.Const));
            return [storiesBuilderInstantiation, node];
        }
        return node;
    };
    return ts.visitEachChild(sourceFile, visitNode, context);
}
