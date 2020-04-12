# `ts-editor`

> 基于 [monaco-editor](https://microsoft.github.io/monaco-editor/) 的 typesc 编辑器，支持实时编译、预览。

## Usage

### 安装：

```bash
npm i @ts-live/ts-editor
```

### 使用

```ts
import {
    Editor,
    monaco
} from '@ts-live/ts-editor';

const editor = new Editor(domElement, options);
```

- domElement 指 `monaco-editor` 编辑器要挂载的 dom 元素
- options 实例化 `Editor` 的选项，支持的完整选项如下：

```ts
interface IEditorOptions = {
    code?: string; // 初始化代码
    compiledCode?: string; // 初始化运行的代码
    delayInit?: boolean; // 是否延迟初始化
    delay?: number; // editor 内容改动后会触发 onCodeChange，该选项用来设置触发延迟的间隔时间
    runable?: boolean; // 是否可运行 code
    compilable?: boolean; // 是否可编译 code
    types?: ITypes; // 仅需要在 language 为 typescript 时设置。module 的类型定义，用来类型提示，格式为 {[moduleName: string]: types string}，可以使用提供的工具包 dts-bundle 来生成。
    scope?: Scope; // 用来像 editor 注入代码依赖的的 module，以使代码可正常执行
    language?: IEditorLanguage; // 支持 typescript、JavaScript，当使用 JavaScript 时不需要设置 types
    // monaco-editor 的编译选项
    compilerOptions?: monaco.languages.typescript.CompilerOptions;
    // monaco-editor 实例编辑器时的选项
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;

    // monaco-editor 创建之前触发
    editorWillCreate?: EditorWillCreateCallback;
    // monaco-editor 创建完成后触发
    editorDidCreate?: EditorDidCreateCallback;
    // editor 内容有改动时触发
    onCodeChange?: OnCodeChangeCallback;
    // code 编译之前触发，如果回调返回 false 会阻止编译
    codeWillCompile?: CodeWillCompileCallback;
    // code 编译成功后触发
    codeDidCompile?: CodeDidCompileCallback;
    // code 运行之前触发，如果回调返回 false 会阻止运行
    codeWillRun?: CodeWillRunCallback;
    // code 运行成功后触发
    codeDidRun?: CodeDidRunCallback;
    // 编译或运行过程中有遇到错误时触发
    onError?: OnErrorCallback;
};

type EditorWillCreateCallback = (compilerOptions: monaco.languages.typescript.CompilerOptions) => void;
type EditorDidCreateCallback = (editor: Editor) => void;
type OnCodeChangeCallback = (e: monaco.editor.IModelContentChangedEvent, lastCode: string, latestCode: string) => void;
type CodeWillCompileCallback = (code: string) => Promise<boolean | void> | boolean | void;
type CodeDidCompileCallback = (code: string, compiledCode: string) => void;
type CodeWillRunCallback = (compiledCode: string) => Promise<boolean | void> | boolean | void;
type CodeDidRunCallback = (ret: any, compiledCode: string) => void;
type OnErrorCallback = (err: Error) => void;
```