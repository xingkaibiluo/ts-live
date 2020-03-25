import React, {useEffect, useRef} from 'react';
import {
    Editor,
    IEditorOptions,
    monaco
} from '@byte-design/ts-editor';
import classnames from 'classnames';
import {ProviderContext} from '../context/ProviderContext';
import {IPreviewerProviderProps} from '../types';


export function PreviewerProvider(props: IPreviewerProviderProps): JSX.Element {
    const defaultOptions: IEditorOptions = {
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

    const {
        children,
        ...options
    } = props;
    const editorOptions = Object.assign(defaultOptions, options);

    const context = {
        editorRef: null,
        previewerRef: null,
        errorRef: null,
        editor: null,
        editorOptions
    };

    const cls = classnames('rp-provider');

    return (
        <ProviderContext.Provider value={context}>
            <div className={cls}>
                {children}
            </div>
        </ProviderContext.Provider>
    );
}