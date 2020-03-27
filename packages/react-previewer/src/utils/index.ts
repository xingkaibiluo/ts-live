import {Editor} from '@byte-design/ts-editor';
import {
    ThemeData,
    IPlainObject
} from '../types';


export function defineTheme(themeName: string, themeData: ThemeData): void {
    Editor.defineTheme(themeName, themeData);
}

export function setTheme(themeName: string): void {
    Editor.setTheme(themeName);
}

export function mergeOptions(target: IPlainObject, source: IPlainObject, keys: string[]): IPlainObject {
    const options: IPlainObject = Object.assign({}, target, source);

    for (const key of keys) {
        options[key] = Object.assign({}, target[key], source[key]);
    }

    return options;
}