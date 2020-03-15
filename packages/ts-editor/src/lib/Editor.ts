import {guid, throttle} from './utils';

export type IEditorLanguage = 'typescript' | 'javascript';

interface IHooks {
    editorWillCreate?: (compilerOptions: monaco.languages.typescript.CompilerOptions) => void;
    editorDidCreate?: (codeEditor: monaco.editor.IStandaloneCodeEditor, codeModel: monaco.editor.ITextModel) => void;
    onCodeChange?: (e: monaco.editor.IModelContentChangedEvent, before: string, after: string) => void;
    codeWillCompile?: (code: string) => boolean;
    codeDidCompile?: (err: Error | null, code: string, compiledCode: string) => void;
    codeWillRun?: (code: string, compiledCode: string) => void;
    codeDidRun?: (err: Error | null, ret: any, compiledCode: string) => void;
}


export type IEditorOptions = IHooks & {
    code?: string;
    compiledCode?: string; // 初始化运行的代码
    delayInit?: boolean; // 是否延迟初始化
    delay?: number;
    runable?: boolean;
    types?: Record<string, string>;
    require: (mod: string) => any;
    language?: IEditorLanguage;
    compilerOptions?: monaco.languages.typescript.CompilerOptions;
    editorOptions?: monaco.editor.IEditorConstructionOptions;
};

export default class Editor {

    private static jsTypes: string[] = [];

    private static tsTypes: string[] = [];

    private static getExports(exports: any) {
        if (typeof exports === 'function') {
            return exports;
        }

        return exports;
    }

    private codeModel?: monaco.editor.ITextModel;

    private codeEditor?: monaco.editor.IStandaloneCodeEditor;

    private compilerOptions: monaco.languages.typescript.CompilerOptions;

    private editorOptions: monaco.editor.IEditorConstructionOptions;

    private readonly hooks: IHooks;

    private language: IEditorLanguage;

    private compiledCode: string | undefined;

    private lastCompiledCode: string;

    private code: string;

    private lastCode: string;

    private domElement: HTMLElement;

    private require: (mod: string) => any;

    private delay = 100;

    private runable: boolean = true;

    private inited: boolean = false;

    constructor(domElement: HTMLElement, options: IEditorOptions) {

        const {
            code = '',
            language = 'typescript',
            require,
            compilerOptions,
            editorOptions,
            compiledCode,
            delay = 100,
            delayInit = false,
            runable = true,
            types = {},
            ...hooks
        } = options;

        this.domElement = domElement;
        this.require = require;
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
            jsx: monaco.languages.typescript.JsxEmit.None
        }, compilerOptions);
        this.editorOptions = Object.assign({
            minimap: {enabled: false},
            automaticLayout: true,
            scrollBeyondLastLine: false
        }, editorOptions);
        this.language = language;
        this.delay = delay;
        this.runable = runable;
        this.code = this.lastCode = code;
        this.compiledCode = compiledCode;
        this.lastCompiledCode = compiledCode || '';
        this.hooks = Object.assign({}, hooks);

        this.addTypes(types);

        if (compiledCode && runable) {
            this.runCode(compiledCode);
        }

        !delayInit && this._init(!!compiledCode);
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

    public getEditor(): monaco.editor.IStandaloneCodeEditor {

        if (this.codeEditor == null) {
            throw new Error('call method init before');
        }

        return this.codeEditor;
    }

    public getModel(): monaco.editor.ITextModel {

        if (this.codeModel == null) {
            throw new Error('call method init before');
        }

        return this.codeModel;
    }

    public setModel(model: monaco.editor.ITextModel) {

        if (this.codeModel != null) {
            this.codeModel.dispose();
        }

        this.codeModel = model;
    }

    public init(compilable: boolean = true) {
        this._init(compilable);
    }

    public dispose() {

        if (this.inited) {
            this.codeModel && this.codeModel.dispose();
            this.codeEditor && this.codeEditor.dispose();
            this.inited = false;
        }
    }

    public runCode(compiledCode: string) {

        if (!this.runable) {
            return;
        }

        const {codeDidRun} = this.hooks;
        const exports = {};
        let err: Error | null = null;
        let ret: any;

        try {

            const func = new Function('exports', 'require', compiledCode);

            func(exports, this.require);

            ret = Editor.getExports(exports);

            codeDidRun && codeDidRun(null, ret, compiledCode);
        } catch (e) {
            err = e;
        } finally {
            codeDidRun && codeDidRun(err, ret, compiledCode);
        }
    }

    public resetCode() {
        if (this.inited) {
            this.getModel().setValue(this.code);
        }
    }

    public getCode(): string {

        if (this.inited) {
            return this.getModel().getValue();
        } else {
            return this.code;
        }
    }

    public getCompiledCode(): string | undefined {
        if (this.inited) {
            return this.getModel().getValue();
        } else {
            return this.compiledCode;
        }
    }

    public getMarkers(): monaco.editor.IMarker[] {
        return monaco.editor.getModelMarkers({resource: this.getModel().uri});
    }

    private _init(compilable: boolean = true) {

        if (this.inited) {
            return;
        }

        this.inited = true;

        const {editorWillCreate, editorDidCreate} = this.hooks;

        if (editorWillCreate) {
            editorWillCreate(this.compilerOptions);
        }

        this.languageDefaults.setCompilerOptions(this.compilerOptions);

        this.codeModel = monaco.editor.createModel(this.code, this.language, this.createFile());
        this.codeEditor = monaco.editor.create(
            this.domElement,
            Object.assign(
                {
                    model: this.codeModel
                },
                this.editorOptions
            )
        );

        compilable && this.compileCode();

        this.editorDidCreate();

        if (editorDidCreate) {
            editorDidCreate(this.codeEditor, this.codeModel);
        }
    }

    private addTypes(types: Record<string, string>) {

        const addedTypes = this.language === 'typescript' ? Editor.tsTypes : Editor.jsTypes;

        Object.entries(types).forEach(([path, content]) => {

            if (addedTypes.indexOf(path) === -1) {
                this.languageDefaults.addExtraLib(content, `file:///node_modules/${path}.d.ts`);
                addedTypes.push(path);
            }
        });
    }

    private editorDidCreate() {
        const {onCodeChange} = this.hooks;

        const handleThrottle = throttle((e) => {
            const changedCode = this.getModel().uri.toString();

            onCodeChange && onCodeChange(e, this.lastCode, changedCode);

            this.lastCode = changedCode;
            this.compileCode();

        }, this.delay);

        this.getEditor().onDidChangeModelContent((e) => {
            handleThrottle(e);
        });
    }

    private compileCode(run: boolean = true): Promise<any> {

        const {codeWillCompile, codeDidCompile} = this.hooks;
        let flag: boolean = true;

        if (codeWillCompile) {
            flag = codeWillCompile(this.lastCode);
        }
        if (!flag) {
            // return;
        }

        return this.getWorkerProcess(this.language)
            .then((worker: any) => {
                return worker(this.getModel().uri).then((client: any, a: any) => {

                    // compile code
                    const filePath = this.getModel().uri.toString();

                    return client.getSemanticDiagnostics(filePath)
                        .then((diagnostics: any) => { // 如果有语法错误，跳过执行
                            diagnostics.forEach((diagnostic: any) => {
                                if (diagnostic.category === 1) { // 过滤 error，即 category=1
                                    throw (diagnostics.messageText);
                                }
                            });
                        }).then(() => {
                            // 只能通过codeModel.uri.toString()获取，否则初始化时报错
                            return client.getEmitOutput(filePath);
                        });
                });
            }).then((result: any) => { // compile success
                this.lastCompiledCode = result.outputFiles[0].text;

                codeDidCompile && codeDidCompile(null, this.lastCode, this.lastCompiledCode);

                run && this.runCode(this.lastCompiledCode);

                return this.lastCompiledCode;
            }).catch(e => {
                // compile error
                codeDidCompile && codeDidCompile(e, this.lastCode, '');
            });
    }

    private createFile(): monaco.Uri {

        const isJSX = this.compilerOptions.jsx !== monaco.languages.typescript.JsxEmit.None;
        const fileExt = this.language === 'typescript' ? 'ts' : 'js';
        const ext = isJSX ? fileExt + 'x' : fileExt;
        const filepath = `input${guid()}.${ext}`;

        return monaco.Uri.file(filepath);
    }
}
