/**
 * @public
 * Type of functions that can be provided to {@link StoriesTransformerOptions.pathToKind}.
 * @param filePath The path of the file that is being transformed
 * @param defaultKind The name of the kind returned by the default `pathToKind` for the provided file path
 * @returns The name that will be given to the kind defined in the file that is being transformed
 */
export declare type PathToKindFunction = (filePath: string, defaultKind: string) => string;
export declare function defaultPathToKind(filePath: string): string;
