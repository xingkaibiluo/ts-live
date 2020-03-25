import React from 'react';
import {IContext} from '../types';

export const ProviderContext = React.createContext<IContext>({
    editorRef: null,
    previewerRef: null,
    errorRef: null,
    editor: null
});
