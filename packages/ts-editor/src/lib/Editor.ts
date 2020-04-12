import {monaco} from '../index';
import {guid, debounce, isFunction} from './utils';

export type IEditorLanguage = 'typescript' | 'javascript';

export type EditorWillCreateCallback = (compilerOptions: monaco.languages.typescript.CompilerOptions) => void;
export type EditorDidCreateCallback = (editor: Editor) => void;
export type OnCodeChangeCallback = (e: monaco.editor.IModelContentChangedEvent, lastCode: string, latestCode: string) => void;
export type CodeWillCompileCallback = (code: string) => Promise<boolean | void> | boolean | void;
export type CodeDidCompileCallback = (code: string, compiledCode: string) => void;
export type CodeWillRunCallback = (compiledCode: string) => Promise<boolean | void> | boolean | void;
export type CodeDidRunCallback = (ret: any, compiledCode: string) => void;
export type OnErrorCallback = (err: Error) => void;

export interface IHooks {
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
}

export type ITypes = Record<string, string>;

export type IEditorOptions = IHooks & {
    code?: string; // 初始化代码
    compiledCode?: string; // 初始化运行的代码
    delayInit?: boolean; // 是否延迟初始化
    delay?: number; // editor 内容改动后会触发 onCodeChange，该选项用来设置触发延迟的间隔时间
    runable?: boolean; // 是否可运行 code
    compilable?: boolean; // 是否可编译 code
    types?: ITypes; // module 的类型定义，用来类型提示，格式为 {[moduleName: string]: types string}
    scope?: Scope; // 用来像 editor 注入代码依赖的的 module，以使代码可正常执行
    language?: IEditorLanguage;
    // monaco-editor 的编译选项
    compilerOptions?: monaco.languages.typescript.CompilerOptions;
    // monaco-editor 实例编辑器时的选项
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
};

export type Scope = {
    [name: string]: any;
} | ((name: string) => any);


export class Editor {

    private _monacoModel?: monaco.editor.ITextModel;

    private _monacoEditor?: monaco.editor.IStandaloneCodeEditor;

    protected static jsTypes: string[] = [];

    protected static tsTypes: string[] = [];

    protected compilerOptions: monaco.languages.typescript.CompilerOptions;

    protected editorOptions: monaco.editor.IStandaloneEditorConstructionOptions;

    protected hooks: IHooks;

    protected language: IEditorLanguage;

    // 初始化时的 compiledCode
    protected originalCompiledCode: string | undefined;

    // editor 最新的 compiledCode
    protected latestCompiledCode: string;

    // 初始化时的 code
    protected originalCode: string;

    // editor 最新的 code
    protected latestCode: string;

    // 挂载 editor 的 dom 元素
    protected domElement: HTMLElement;

    protected scope: Scope;

    protected delay: number;

    protected runable: boolean = true;

    protected compilable: boolean = true;

    // 是否已执行过 init
    protected inited: boolean = false;

    constructor(domElement: HTMLElement, options: IEditorOptions) {

        const {
            code = '',
            language = 'typescript',
            scope,
            compilerOptions,
            editorOptions,
            compiledCode,
            delay = 200,
            delayInit = false,
            runable = true,
            compilable = true,
            types = {},
            ...hooks
        } = options;

        this.domElement = domElement;
        this.scope = scope || {};
        this.compilerOptions = Object.assign({

            noImplicitAny: true,
            strictNullChecks: true,
            strictFunctionTypes: true,
            strictPropertyInitialization: true,
            noImplicitThis: true,
            noImplicitReturns: true,

            alwaysStrict: true,
            allowUnreachableCode: false,
            allowUnusedLabels: false,

            downlevelIteration: false,
            noEmitHelpers: false,
            noLib: false,
            noStrictGenericChecks: false,
            noUnusedLocals: false,
            noUnusedParameters: false,

            esModuleInterop: true,
            preserveConstEnums: false,
            removeComments: false,
            skipLibCheck: false,

            checkJs: false,
            allowJs: false,

            experimentalDecorators: false,
            emitDecoratorMetadata: false,

            target: monaco.languages.typescript.ScriptTarget.ES2017,
            jsx: monaco.languages.typescript.JsxEmit.None,
            module: monaco.languages.typescript.ModuleKind.CommonJS
        }, compilerOptions);
        this.editorOptions = Object.assign({
            minimap: {enabled: false},
            automaticLayout: true,
            scrollBeyondLastLine: false
        }, editorOptions);
        this.language = language;
        this.delay = delay;
        this.runable = runable;
        this.compilable = compilable;
        this.originalCode = this.latestCode = code;
        this.originalCompiledCode = compiledCode;
        this.latestCompiledCode = compiledCode || '';
        this.hooks = Object.assign({}, hooks);

        // 收集 types
        this.addTypes(types);

        // monaco-editor 初始化比较长，初始化成功后还要对 code 进行编译，会使输出结果延迟比较长。如果有传递 compiledCode 会对该代码立即执行，可以有效减少等待时间。
        if (compiledCode && runable) {
            this.runCode(compiledCode);
        }

        !delayInit && this._init();
    }

    /**
     * 定义 monaco-editor 主题
     * @param themeName 
     * @param themeData 
     */
    public static defineTheme(themeName: string, themeData: monaco.editor.IStandaloneThemeData): void {
        monaco.editor.defineTheme(themeName, themeData);
    }

    /**
     * 使用自定义主题
     * @param themeName 
     */
    public static setTheme(themeName: string): void {
        monaco.editor.setTheme(themeName);
    }

    public init() {
        this._init();
    }

    public getInited(): boolean {
        return this.inited;
    }

    /**
     * 获取 monaco worker
     * @param language 
     */
    public getWorkerProcess(language: IEditorLanguage): Promise<any> {

        if (language === 'javascript') {
            return monaco.languages.typescript.getJavaScriptWorker();
        }

        return monaco.languages.typescript.getTypeScriptWorker();
    }

    /**
     * 获取 monaco editor 实例
    */
    public get monacoEditor(): monaco.editor.IStandaloneCodeEditor {

        if (this._monacoEditor == null) {
            throw new Error('call method init before');
        }

        return this._monacoEditor;
    }

    /**
     * 获取 monaco-editor model
    */
    public get monacoModel(): monaco.editor.ITextModel {

        if (this._monacoModel == null) {
            throw new Error('call method init before');
        }

        return this._monacoModel;
    }

    public set monacoModel(model: monaco.editor.ITextModel) {

        if (this._monacoModel != null) {
            this._monacoModel.dispose();
        }

        this._monacoModel = model;
    }

    /**
     * 获取 editor 的当前内容
    */
    public get code(): string {
        return this.latestCode;
    }

    /**
     * 获取 editor 的当前内容编译后的代码
    */
    public get compiledCode(): string | undefined {
        return this.latestCompiledCode;
    }

    public getMarkers(): monaco.editor.IMarker[] {
        return monaco.editor.getModelMarkers({resource: this.monacoModel.uri});
    }

    /**
     * editor 销毁清理
     */
    public dispose() {
        if (this.inited) {
            this.monacoModel.dispose();
            this.monacoEditor.dispose();
            this.inited = false;
        }
    }

    /**
     * 运行 compiledCode
     * @param compiledCode 
     */
    public async runCode(compiledCode: string) {
        const {
            codeWillRun,
            codeDidRun,
            onError
        } = this.hooks;
        let runable: boolean = this.runable;

        if (runable && isFunction(codeWillRun)) {
            runable = (await codeWillRun(compiledCode)) !== false;
        }

        if (this.runable === false) {
            return;
        }

        const exports = {};
        let err: Error | null = null;
        let ret: any;

        try {
            const func = new Function('exports', 'require', compiledCode);

            func(exports, this.requireMod.bind(this));

            ret = exports;
        } catch (e) {
            err = e;
        } finally {
            if (err) {
                isFunction(onError) && onError(err);
            } else {
                isFunction(codeDidRun) && codeDidRun(ret, compiledCode);
            }
        }
    }

    /**
     * 重置 editor 内容为初始化时的 code
     */
    public resetCode() {
        if (this.inited) {
            this.monacoModel.setValue(this.originalCode);
        }
    }

    /**
     * 初始化 monaco
     */
    protected async _init() {
        // 避免重复初始化
        if (this.inited) {
            return;
        }

        this.inited = true;

        const {editorWillCreate} = this.hooks;

        if (editorWillCreate) {
            editorWillCreate(this.compilerOptions);
        }

        this.languageDefaults.setCompilerOptions(this.compilerOptions);

        this._monacoModel = monaco.editor.createModel(this.latestCode, this.language, this.createFile());
        this._monacoEditor = monaco.editor.create(
            this.domElement,
            Object.assign(
                {
                    model: this._monacoModel
                },
                this.editorOptions
            )
        );

        if (this.compilable) {
            this.compileCode();
        }

        // 待 Editor 实例化完成后再触发 editorDidCreate 
        setTimeout(() => {
            this.editorDidCreate();
        }, 0);
    }

    protected get languageDefaults(): monaco.languages.typescript.LanguageServiceDefaults {

        return this.language === 'javascript' ?
            monaco.languages.typescript.javascriptDefaults
            :
            monaco.languages.typescript.typescriptDefaults;
    }

    /**
     * 收集 type
     * @param types 
     */
    protected addTypes(types: ITypes) {

        const addedTypes = this.language === 'typescript' ? Editor.tsTypes : Editor.jsTypes;

        Object.entries(types).forEach(([moduleName, typeContent]) => {
            // 避免重复注入相同 moduleName 的 type
            if (addedTypes.indexOf(moduleName) === -1) {
                this.languageDefaults.addExtraLib(typeContent, `file:///node_modules/${moduleName}.d.ts`);
                addedTypes.push(moduleName);
            }
        });
    }

    protected editorDidCreate() {
        const {
            onCodeChange,
            editorDidCreate
        } = this.hooks;

        if (isFunction(editorDidCreate)) {
            editorDidCreate(this);
        }

        // 避免频繁编译、执行 code，使用 debounce 限流
        const handleDebounce = debounce((e) => {
            const changedCode = this.monacoModel.getValue();

            if (isFunction(onCodeChange)) {
                onCodeChange(e, this.latestCode, changedCode);
            }

            this.latestCode = changedCode;
            this.compileCode();

        }, this.delay);

        // 监听 monaco content 改变
        this.monacoEditor.onDidChangeModelContent((e) => {
            handleDebounce(e);
        });
    }

    protected codeDidCompile(err: Error | null, code: string, compiledCode: string) {
        const {
            codeDidCompile,
            onError
        } = this.hooks;

        if (!err) {
            // 编译成功
            isFunction(codeDidCompile) && codeDidCompile(code, compiledCode);
            this.runCode(compiledCode);
        } else {
            // 编译失败
            isFunction(onError) && onError(err);
        }
    }

    protected async compileCode() {

        const {codeWillCompile} = this.hooks;
        let compilable: boolean = this.compilable;

        if (isFunction(codeWillCompile)) {
            compilable = (await codeWillCompile(this.latestCode)) !== false;
        }
        if (compilable === false) {
            return;
        }
        let err: Error | null = null;

        return this.getWorkerProcess(this.language)
            .then((worker: any) => {
                return worker(this.monacoModel.uri).then((client: any, a: any) => {
                    // compile code
                    const filePath = this.monacoModel.uri.toString();
                    const getDiagnostics = [client.getSyntacticDiagnostics(filePath)];

                    if (this.language === 'typescript') {
                        // typescript 同时进行语义检查
                        getDiagnostics.push(client.getSemanticDiagnostics(filePath));
                    }

                    return Promise.all(getDiagnostics)
                        .then((diagnostics: any) => { // 如果有语法错误，跳过执行
                            const flattenDiagnostics = diagnostics.flat();

                            flattenDiagnostics.forEach((diagnostic: any) => {
                                if (diagnostic.category === 1) { // 过滤 error，即 category=1
                                    const messageText = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText;

                                    throw new Error(messageText);
                                }
                            });
                        }).then(() => {
                            // 只能通过_monacoModel.uri.toString()获取，否则初始化时报错
                            return client.getEmitOutput(filePath);
                        });
                });
            }).then((result: any) => { // compile success
                this.latestCompiledCode = result.outputFiles[0].text;

                return this.latestCompiledCode;
            }).catch((error: Error) => {
                // compile error
                err = error;
            }).finally(() => {
                this.codeDidCompile(err, this.latestCode, this.latestCompiledCode);
            });
    }

    protected createFile(): monaco.Uri {

        const isJSX = this.compilerOptions.jsx !== monaco.languages.typescript.JsxEmit.None;
        const fileExt = 'ts';
        const ext = isJSX ? fileExt + 'x' : fileExt;
        const filepath = `input${guid()}.${ext}`;

        return monaco.Uri.file(filepath);
    }

    /**
     * 通过 moduleName 查找对应的 module
     * @param moduleName 
     */
    protected requireMod(moduleName: string) {
        let mod: any;

        if (isFunction(this.scope)) {
            mod = this.scope(moduleName);
        } else {
            mod = this.scope[moduleName];
        }

        return mod;
    }
}
