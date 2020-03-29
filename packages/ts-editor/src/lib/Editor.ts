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

interface IHooks {
    editorWillCreate?: EditorWillCreateCallback;
    editorDidCreate?: EditorDidCreateCallback;
    onCodeChange?: OnCodeChangeCallback;
    codeWillCompile?: CodeWillCompileCallback;
    codeDidCompile?: CodeDidCompileCallback;
    codeWillRun?: CodeWillRunCallback;
    codeDidRun?: CodeDidRunCallback;
    onError?: OnErrorCallback;
}

export type ITypes = Record<string, string>;

export type IEditorOptions = IHooks & {
    code?: string;
    compiledCode?: string; // 初始化运行的代码
    delayInit?: boolean; // 是否延迟初始化
    delay?: number;
    runable?: boolean;
    compilable?: boolean;
    types?: ITypes;
    scope?: Scope;
    language?: IEditorLanguage;
    compilerOptions?: monaco.languages.typescript.CompilerOptions;
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

    protected readonly hooks: IHooks;

    protected language: IEditorLanguage;

    protected originalCompiledCode: string | undefined;

    protected latestCompiledCode: string;

    protected originalCode: string;

    protected latestCode: string;

    protected domElement: HTMLElement;

    protected scope: Scope;

    protected delay = 100;

    protected runable: boolean = true;

    protected compilable: boolean = true;

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

        this.addTypes(types);

        if (compiledCode && runable) {
            this.runCode(compiledCode);
        }

        !delayInit && this._init();
    }

    public static defineTheme(themeName: string, themeData: monaco.editor.IStandaloneThemeData): void {
        monaco.editor.defineTheme(themeName, themeData);
    }

    public static setTheme(themeName: string): void {
        monaco.editor.setTheme(themeName);
    }

    public get languageDefaults(): monaco.languages.typescript.LanguageServiceDefaults {

        return this.language === 'javascript' ?
            monaco.languages.typescript.javascriptDefaults
            :
            monaco.languages.typescript.typescriptDefaults;
    }

    public getWorkerProcess(language: IEditorLanguage): Promise<any> {

        if (language === 'javascript') {
            return monaco.languages.typescript.getJavaScriptWorker();
        }

        return monaco.languages.typescript.getTypeScriptWorker();
    }

    public get monacoEditor(): monaco.editor.IStandaloneCodeEditor {

        if (this._monacoEditor == null) {
            throw new Error('call method init before');
        }

        return this._monacoEditor;
    }

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

    public get code(): string {
        return this.latestCode;
    }

    public get compiledCode(): string | undefined {
        return this.latestCompiledCode;
    }

    public getMarkers(): monaco.editor.IMarker[] {
        return monaco.editor.getModelMarkers({resource: this.monacoModel.uri});
    }

    public init() {
        this._init();
    }

    public dispose() {

        if (this.inited) {
            this.monacoModel.dispose();
            this.monacoEditor.dispose();
            this.inited = false;
        }
    }

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

    public resetCode() {
        if (this.inited) {
            this.monacoModel.setValue(this.originalCode);
        }
    }

    protected async _init() {

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

    protected addTypes(types: ITypes) {

        const addedTypes = this.language === 'typescript' ? Editor.tsTypes : Editor.jsTypes;

        Object.entries(types).forEach(([path, content]) => {

            if (addedTypes.indexOf(path) === -1) {
                this.languageDefaults.addExtraLib(content, `file:///node_modules/${path}.d.ts`);
                addedTypes.push(path);
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

        const handleDebounce = debounce((e) => {
            const changedCode = this.monacoModel.getValue();

            if (isFunction(onCodeChange)) {
                onCodeChange(e, this.latestCode, changedCode);
            }

            this.latestCode = changedCode;
            this.compileCode();

        }, this.delay);

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
            isFunction(codeDidCompile) && codeDidCompile(code, compiledCode);
            this.runCode(compiledCode);
        } else {
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

                    return client.getSemanticDiagnostics(filePath)
                        .then((diagnostics: any) => { // 如果有语法错误，跳过执行
                            diagnostics.forEach((diagnostic: any) => {
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
        const fileExt = this.language === 'typescript' ? 'ts' : 'js';
        const ext = isJSX ? fileExt + 'x' : fileExt;
        const filepath = `input${guid()}.${ext}`;

        return monaco.Uri.file(filepath);
    }

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
