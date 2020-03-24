import React, {useEffect, useRef} from 'react';
import {
    Editor,
    IEditorOptions,
    monaco
} from '@byte-design/ts-editor';

export interface IPreviewerProviderProps {

}

export function PreviewerProvider(props: IPreviewerProviderProps): JSX.Element {
    const codeLive = useRef<Editor>();
    const editorRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const options: IEditorOptions = {
        code: 'let num = 111',
        types: {},
        delayInit: true,
        compiledCode: '',
        compilerOptions: {
            target: monaco.languages.typescript.ScriptTarget.ES2015,
            jsx: monaco.languages.typescript.JsxEmit.React,
            module: monaco.languages.typescript.ModuleKind.CommonJS
        },
        editorOptions: {
            lineHeight: 18,
            lineNumbers: 'off'
        },
        scope: {
            react: React
        },
        codeWillCompile: (code: string) => {
        },
        codeDidRun: (err, ret, compiledCode) => {
            console.log('-----------run result', err, ret)
            // const Preview = exports.default;
            // ReactDOM.render(<Preview />, previewRef.current);
        },
        onCodeChange: (e: any, lastCode: string, lateset: string) => {
            console.log('-----------onCodeChange', lastCode, lateset)
        },
        codeDidCompile: (err: Error | null, code: string, compiledCode: string) => {
            console.log('-----------codeDidCompile', code, err)
        }
    };

    useEffect(() => {
        if (editorRef.current === null) {
            return;
        }
        codeLive.current = new Editor(editorRef.current, options);
        codeLive.current.init();
    })


    return (
        <div className="App">
            <header className="App-header">
                <div className="button" onClick={() => {
                    codeLive.current!.resetCode();
                }}>
                    click me
          </div>
                <div className="preview" ref={previewRef} />
                <div className="editor" ref={editorRef} style={{width: '500px', height: '500px'}} />

            </header>
        </div>
    );
}