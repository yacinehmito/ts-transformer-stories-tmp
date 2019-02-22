const path = require('path');
const ts = require('typescript');

const cwd = process.cwd();

const isTruthy = (arg) => Boolean(arg);

const defaultKindBuilder = (filePath) => {
  const relativeFilePath = path.relative(cwd, filePath);
  const parts = relativeFilePath.split('/');
  const filename = parts.pop();
  const basename = filename.split('.').find(isTruthy);
  if (basename !== 'index') {
    parts.push(basename);
  }
  if (parts.length <= 1) {
    return basename;
  }
  return parts.join('/');
};

const storiesTransformer = (opts = {}) => {
  const {
    storiesModule = 'stories',
    storybookModule = '@storybook/html',
    kindBuilder = defaultKindBuilder,
    test,
  } = opts;

  const regexp = test && new RegExp(test);

  const transformerFactory = (context) => {
    return (file) => {
      const filePath = file.originalFileName;

      if (regexp && !regexp.test(filePath)) {
        return file;
      }

      const defaultKind = defaultKindBuilder(filePath);
      const kind = kindBuilder
        ? kindBuilder(filePath, defaultKind)
        : defaultKind;

      return visitSourceFile(file, context, {
        KIND: kind,
        STORIES_MODULE_NAME: storiesModule,
        STORYBOOK_MODULE_NAME: storybookModule,
      });
    };
  };

  return transformerFactory;
};

const visitSourceFile = (
  sourceFile,
  context,
  { KIND, STORIES_MODULE_NAME, STORYBOOK_MODULE_NAME },
) => {
  const storiesOfIdentifier = ts.createUniqueName('storiesOf');
  let storiesIdentifier;

  let visitNode = (node) => {
    // Find declaration of the form:
    //   import <storiesIdentifier> from '<STORIES_MODULE_NAME>'
    // e.g.:
    //   import stories from 'stories'
    // Replace it with:
    //   import { storiesOf as <storiesOfIdentifier> } from '<STORYBOOK_MODULE_NAME>'
    // e.g.:
    //   import { storiesOf as storiesOf_unique } from '@storybook/html'
    if (ts.isImportDeclaration(node) && !storiesIdentifier) {
      const { moduleSpecifier, importClause } = node;
      if (
        moduleSpecifier &&
        ts.isStringLiteral(moduleSpecifier) &&
        moduleSpecifier.text === STORIES_MODULE_NAME &&
        importClause &&
        ts.isImportClause(importClause) &&
        ts.isIdentifier(importClause.name)
      ) {
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
          ts.createLiteral(STORYBOOK_MODULE_NAME),
        );

        return storiesOfImport;
      }
    }

    // Before the first non-import node, write:
    //   const <storiesIdentifier> = <storiesOfIdentifier>(<KIND>, module);
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
                [ts.createLiteral(KIND), ts.createIdentifier('module')],
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

  return ts.visitEachChild(
    sourceFile,
    (childNode) => visitNode(childNode),
    context,
  );
};

module.exports = { storiesTransformer };
