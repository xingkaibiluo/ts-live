export interface IPlainObject {
    [key: string]: any;
}

export function mergeOptions(target: IPlainObject, source: IPlainObject, keys: string[]): IPlainObject {
    const options: IPlainObject = Object.assign({}, target, source);

    for (const key of keys) {
        options[key] = Object.assign({}, target[key], source[key]);
    }

    return options;
}