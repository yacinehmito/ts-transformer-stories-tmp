import * as ts from 'typescript';
import { PathToKindFunction } from './path-to-kind';
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
     * The regular expression that identifies the file that must be transformed.
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
export declare function storiesTransformer(options?: StoriesTransformerOptions): ts.TransformerFactory<ts.SourceFile>;
export { PathToKindFunction } from './path-to-kind';
