import {Editor} from '@ts-live/ts-editor';
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

// 判断一个对象是否是一个函数
export function isFunction(fun: unknown): fun is Function {
    return typeof fun === 'function';
}

export function mergeOptions(target: IPlainObject, source: IPlainObject, keys: string[]): IPlainObject {
    const options: IPlainObject = Object.assign({}, target, source);

    for (const key of keys) {
        options[key] = Object.assign({}, target[key], source[key]);
    }

    return options;
}

export function runCallbacks(...callbacks: Array<Function | undefined>) {
    return function (...args: any[]) {
        for (const callback of callbacks) {
            if (isFunction(callback)) {
                callback(...args);
            }
        }
    }
}