import React, {useEffect, useRef, useMemo} from 'react';
import {
    IEditorOptions,
    monaco
} from '@byte-design/ts-editor';
import classnames from 'classnames';
import {ProviderContext} from '../context/ProviderContext';
import {mergeOptions} from '../utils';
import {IPreviewerProviderProps, IContext} from '../types';


export function PreviewerProvider(props: IPreviewerProviderProps): JSX.Element {
    const defaultOptions: IEditorOptions = {
        types: {},
        delayInit: false,
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
        }
    };

    const {
        children,
        className,
        ...options
    } = props;
    const tsEditorOptions = useRef<IEditorOptions>();

    if (!tsEditorOptions.current) {
        console.log('-----------update ref')
        tsEditorOptions.current = mergeOptions(defaultOptions, options, ['editorOptions', 'compilerOptions', 'scope']);
    }

    const context: IContext = {
        editorRef: null,
        previewerRef: null,
        errorRef: null,
        editor: null,
        editorOptions: tsEditorOptions.current
    };

    useEffect(() => {
        console.log('-----------PreviewerProvider effect')
    });

    const cls = classnames(className, 'rp-provider');

    return (
        <ProviderContext.Provider value={context}>
            <div className={cls}>
                {children}
            </div>
        </ProviderContext.Provider>
    );
}