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

export function PreviewerEditor(props: IPreviewerEditorProps): JSX.Element {
    const {
        width,
        height,
        className
    } = props;
    const context = useContext(ProviderContext);

    const codeLive = useRef<Editor>();
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        context.editorRef = editorRef.current;

        const {
            editorOptions = {}
        } = context;

        if (context.editorRef === null) {
            return;
        }
        codeLive.current = new Editor(context.editorRef, editorOptions);
        codeLive.current.init();
    });

    const cls = classnames(className, 'rp-editor');

    return (
        <div className={cls} ref={editorRef} style={{width, height}}>
        </div>
    );
}