// 一个可以用来当任何函数的类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionAny = (...args: any[]) => any;

// 补齐TypeScript的类型定义
export type FunctionParams<T extends FunctionAny> = T extends (...args: infer R) => unknown
    ? R
    : never;


/**
 * 生成4位随机数
 */
function s4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

/**
 * 生成全局唯一标识符
 *
 * @return 返回一个guid
 */
export function guid(): string {
    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

/**
 * 函数节流
 *
 * @param fn 要节流的函数
 * @param delay 节流时间间隔
 */
export function throttle<T extends FunctionAny>(fn: T, delay: number): (...args: FunctionParams<T>) => void {

    let timer: number | null = null;
    let remaining = 0;
    let previous = +new Date();

    return (...args: FunctionParams<T>): void => {

        const now = +new Date();

        remaining = now - previous;

        if (remaining >= delay) {

            if (timer) {
                window.clearTimeout(timer);
            }

            fn.apply(null, args);
            previous = now;
        } else if (!timer) {
            timer = window.setTimeout(() => {
                fn.apply(null, args);
                previous = +new Date();
            }, delay - remaining);
        }
    };
}
