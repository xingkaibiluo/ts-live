import {
    Editor,
    IEditorOptions,
    monaco,
    CodeDidRunCallback,
    OnErrorCallback,
    CodeDidCompileCallback
} from '@byte-design/ts-editor';
import {ReactNode} from 'react';

export type ThemeData = monaco.editor.IStandaloneThemeData;

export interface IPlainObject {
    [key: string]: any;
}

export interface IPreviewerProviderProps extends IEditorOptions {
    children: ReactNode;
    className?: string;
}

export interface IContext {
    editorRef: HTMLElement | null;

    previewerRef: HTMLElement | null;

    errorRef: HTMLElement | null;

    editor: Editor | null;

    editorOptions: IEditorOptions;

    codeDidCompileCallbacks: CodeDidCompileCallback[];
    codeDidRunCallbacks: CodeDidRunCallback[];
    onErrorCallbacks: OnErrorCallback[];
}

export interface IPreviewerEditorProps {
    width: string;
    height?: string;
    autoHeight?: boolean;
    // autoHeight 为 true 时，编辑器最小高度
    minHeight?: number;
    // autoHeight 为 true 时，编辑器最大高度，为 0 时表示不限制高度
    maxHeight?: number;
    className?: string;
    getEditor?: (editor: Editor) => void;
}

export interface IPreviewerErrorProps {
    className?: string;
    renderError?: (error: Error | null) => JSX.Element;
}

export interface IPreviewerProps {
    className?: string;
}