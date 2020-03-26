import {
    Editor,
    IEditorOptions,
    monaco
} from '@byte-design/ts-editor';
import {ReactNode} from 'react';


export interface IPreviewerProviderProps extends IEditorOptions {
    children: ReactNode;
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
    className?: string;
}

export interface IPreviewerErrorProps {
    className?: string;
}

export interface IPreviewerProps {
    className?: string;
}