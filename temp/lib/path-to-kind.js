import { normalize, parse, join } from 'path';
function isTruthy(arg) {
    return Boolean(arg);
}
export function defaultPathToKind(filePath) {
    const { name, dir } = parse(normalize(filePath));
    if (!name)
        return '';
    const nameWithoutSuffix = name.split('.').find(isTruthy);
    if (!nameWithoutSuffix || nameWithoutSuffix === 'index') {
        return dir || '';
    }
    return join(dir, nameWithoutSuffix);
}
