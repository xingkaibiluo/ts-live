import {
    Editor,
    IEditorOptions,
    monaco
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
}

export interface IPreviewerEditorProps {
    width: string;
    height: string;
    autoHeight?: boolean;
    className?: string;
}

export interface IPreviewerErrorProps {
    className?: string;
    onError?: (error: Error | null) => void;
    children?: ReactNode;
}

export interface IPreviewerProps {
    className?: string;
}