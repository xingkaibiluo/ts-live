import React, {useContext, useRef, useEffect} from 'react';
import classnames from 'classnames';
import {
    Editor,
    IEditorOptions,
    monaco
} from '@byte-design/ts-editor';
import {ProviderContext} from '../context/ProviderContext';
import {
    IPreviewerEditorProps
} from '../types';
import {useState} from 'react';

const autoHeightCreator = (callback?: (height: string) => void) => {
    let lastLineCount = 0;

    return (codeLive?: Editor) => {
        if (codeLive) {
            const editor = codeLive.editor;
            const model = codeLive.model;
            const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
            const lineCount = model.getLineCount();

            if (lineCount !== lastLineCount) {
                const height = lineCount * lineHeight + 20;

                callback && callback(`${height}px`);
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
        height,
        className,
        autoHeight = false
    } = props;
    const context = useContext(ProviderContext);

    const editor = useRef<Editor>();
    const editorRef = useRef<HTMLDivElement>(null);

    const [editorHeight, setEditorHeight] = useState<string>(height);
    const autoHeightHandle = autoHeightCreator(height => {
        setEditorHeight(height);
    });


    useEffect(() => {
        console.log('-----------PreviewerEditor effect')
        context.editorRef = editorRef.current;

        const {
            editorOptions = {}
        } = context;

        if (context.editorRef === null) {
            return;
        }
        const {
            editorDidCreate,
            onCodeChange
        } = editorOptions;

        editorOptions.editorDidCreate = (codeEditor: monaco.editor.IStandaloneCodeEditor, codeModel: monaco.editor.ITextModel) => {
            autoHeightHandle(editor.current);

            if (editorDidCreate) {
                editorDidCreate(codeEditor, codeModel);
            }
        };
        editorOptions.onCodeChange = (e: monaco.editor.IModelContentChangedEvent, lastCode: string, latestCode: string) => {
            autoHeightHandle(editor.current);

            if (onCodeChange) {
                onCodeChange(e, lastCode, latestCode);
            }
        }

        editor.current = new Editor(context.editorRef, editorOptions);
        // editor.current.init();
    }, []);

    const cls = classnames(className, 'rp-editor');

    return (
        <div className={cls} ref={editorRef} style={{width, height: editorHeight}}>
        </div>
    );
}