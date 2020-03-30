import {ReactNode} from 'react';
import {
    Editor,
    IEditorOptions,
    monaco,
    CodeDidRunCallback,
    OnErrorCallback,
    CodeDidCompileCallback
} from '@byte-design/ts-editor';

export type ThemeData = monaco.editor.IStandaloneThemeData;

export interface IPlainObject {
    [key: string]: any;
}

export interface IPreviewerProviderProps extends IEditorOptions {
    children: ReactNode;
    className?: string;
}

export interface IContext {
    editor: Editor | null;
    editorOptions: IEditorOptions;

    codeDidCompileCallbacks: CodeDidCompileCallback[];
    codeDidRunCallbacks: CodeDidRunCallback[];
    onErrorCallbacks: OnErrorCallback[];
}

export interface IPreviewerEditorProps {
    // editor width
    width: number;
    // editor height
    height?: number;
    // editor 是否自适应内容高度
    autoHeight?: boolean;
    // autoHeight 为 true 时，编辑器最小高度
    minHeight?: number;
    // autoHeight 为 true 时，编辑器最大高度，为 0 时表示不限制高度
    maxHeight?: number;
    // 获取 editor 实例
    getEditor?: (editor: Editor) => void;
    className?: string;
}

export interface IPreviewerErrorProps {
    className?: string;
    // 当有错误时，自定义渲染 error
    renderError?: (error: Error | null) => JSX.Element | null;
}

export interface IPreviewerProps {
    className?: string;
}