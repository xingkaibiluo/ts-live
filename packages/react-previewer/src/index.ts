import {
    monaco,
    Editor
} from '@byte-design/ts-editor';

export {
    PreviewerProvider
} from './components/PreviewerProvider';

export {
    PreviewerEditor
} from './components/PreviewerEditor';

export {
    PreviewerError
} from './components/PreviewerError';


export {
    Previewer
} from './components/Previewer';

export {
    IPreviewerProviderProps
} from './types';

export {
    ITypes
} from '@byte-design/ts-editor';

export type ThemeData = monaco.editor.IStandaloneThemeData;

export function defineTheme(themeName: string, themeData: ThemeData): void {
    Editor.defineTheme(themeName, themeData);
}

export function setTheme(themeName: string): void {
    Editor.setTheme(themeName);
}