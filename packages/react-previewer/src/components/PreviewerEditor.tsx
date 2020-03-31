import React, {useContext, useRef, useEffect, useCallback} from 'react';
import classnames from 'classnames';
import {
    Editor,
    monaco
} from '@ts-live/ts-editor';
import {ProviderContext} from '../context/ProviderContext';
import {runCallbacks} from '../utils';
import {
    IPreviewerEditorProps
} from '../types';
import {useState} from 'react';

const autoHeightCreator = (callback?: (height: number) => void) => {
    let lastLineCount = 0;

    return (editor?: Editor) => {
        if (editor) {
            const monacoEditor = editor.monacoEditor;
            const monacoModel = editor.monacoModel;
            const lineHeight = monacoEditor.getOption(monaco.editor.EditorOption.lineHeight);
            const lineCount = monacoModel.getLineCount();

            if (lineCount !== lastLineCount) {
                const height = lineCount * lineHeight + 20;

                callback && callback(height);
            }

            lastLineCount = lineCount;

            return (lc: number) => {
                lastLineCount = lc;
            };
        }
    };
};


export function PreviewerEditor(props: IPreviewerEditorProps): JSX.Element {
    const {
        width,
        height = 0,
        className,
        autoHeight = false,
        minHeight = 0,
        maxHeight = 0,
        getEditor
    } = props;
    const context = useContext(ProviderContext);

    const editor = useRef<Editor>();
    const editorRef = useRef<HTMLDivElement>(null);

    const [editorHeight, setEditorHeight] = useState<number>(height);
    const autoHeightHandle = useCallback(autoHeightCreator(height => {
        if (height < minHeight) {
            height = minHeight;
        }
        if (maxHeight > 0 && height > maxHeight) {
            height = maxHeight;
        }
        setEditorHeight(height);
    }), []);


    useEffect(() => {
        if (editorRef.current === null) {
            return;
        }

        const {
            editorOptions = {},
            onErrorCallbacks,
            codeDidRunCallbacks,
            codeDidCompileCallbacks
        } = context;

        const {
            editorDidCreate,
            onCodeChange,
            onError,
            codeDidCompile,
            codeDidRun
        } = editorOptions;

        editorOptions.onError = runCallbacks(...onErrorCallbacks, onError);

        editorOptions.codeDidCompile = runCallbacks(...codeDidCompileCallbacks, codeDidCompile);

        editorOptions.codeDidRun = runCallbacks(...codeDidRunCallbacks, codeDidRun);

        if (autoHeight) {
            editorOptions.editorDidCreate = (editor) => {
                autoHeightHandle(editor);

                if (editorDidCreate) {
                    editorDidCreate(editor);
                }
            };
            editorOptions.onCodeChange = (e, lastCode: string, latestCode: string) => {
                autoHeightHandle(editor.current);

                if (onCodeChange) {
                    onCodeChange(e, lastCode, latestCode);
                }
            }
        }

        editor.current = new Editor(editorRef.current, editorOptions);
        getEditor && getEditor(editor.current);
        // editor.current.init();

    }, []);

    const cls = classnames(className, 'rp-editor');

    return (
        <div className={cls} ref={editorRef} style={{width, height: editorHeight}}>
        </div>
    );
}