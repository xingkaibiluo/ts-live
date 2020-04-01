# `dts-bundle`

> 该模块用来对指定 `.d.ts` 文件进行解析，把其包含的类型声明及依赖的类型声明都打包到指定 json 文件里。json 元素的 `key` 为 `moduleName`，`value` 为 `moduleName` 的类型声明。


## Usage

### 安装：

```bash
npm i @ts-live/dts-bundle
```

### 使用
```ts
import {DtsBundle} from '@ts-live/dts-bundle';

const dts = new DtsBundle({
    projectDir: __dirname,
    moduleName: 'ts-previewer-demo',
    entry: './index.d.ts',
    out: './src/dts/types.json'
});

dts.bundle();
```

或者可以直接通过命令 `dts-bundle -c ./.dts-bundle.js` 来使用。`-c` 选项用来指定配置文件，默认为当前目录下的 `.dts-bundle.js` 文件，如:

```js
//.dts-bundle.js
module.exports = {
    moduleName: 'ts-previewer-demo',
    entry: './index.d.ts',
    out: './src/dts/types.json',
    // debugOut: './src/dts/types.d.ts',
    parseExternal: () => true,
}
```

### options

`.dts-bundle.js` 支持的配置选项或者实例 `DtsBundle` 时的完整参数定义如下:

```ts
interface IOptions {
    // entry 对应的 module
    moduleName: string;
    // .d.ts 入口文件
    entry: string;
    // 项目地址，需要时绝对路径，如果是相对路径，会相对 process.cwd 来转为绝对路径
    projectDir: string;
    // 生成的类型文件地址
    out: string;
    // 指定生成的 ts 文件路径，方便查看调试
    debugOut?: string;
    // 其他的 modules 会一起合并到最终生成的类型文件里
    extraModules?: string[];
    // 其他的 reference 会一起合并到最终生成的类型文件里
    extraReferences?: string[];
    // 解析外部依赖模块的路径，返回 false 跳过该 module，否则返回 module 的 .d.ts 绝对路径
    parseExternal?: (moduleName: string) => string | boolean;
}
```