import React from 'react';
import {IContext} from '../types';

export const ProviderContext = React.createContext<IContext>({
    editor: null,
    editorOptions: {},
    codeDidCompileCallbacks: [],
    codeDidRunCallbacks: [],
    onErrorCallbacks: []
});
