// @public
declare type PathToKindFunction = (filePath: string, defaultKind: string) => string;

// @public
declare function storiesTransformer(options?: StoriesTransformerOptions): ts.TransformerFactory<ts.SourceFile>;

// @public
interface StoriesTransformerOptions {
    pathToKind?: PathToKindFunction;
    pattern?: RegExp;
    rootDir?: string;
    storiesModule?: string;
    storybookModule?: string;
    unnamedKind?: string;
}


// (No @packageDocumentation comment for this package)
