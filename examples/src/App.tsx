import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    PreviewerProvider,
    Previewer,
    PreviewerEditor,
    PreviewerError,
    ITypes
} from '@byte-design/react-previewer';
import '@byte-design/react-previewer/style/index.css';
import * as components from '@byte-design/ui';
import '@byte-design/ui/themes/platform/index.css';
import typesData from './dts/types.json';
import codes from './codes';
import './App.css';

const types: ITypes = {};
for (const type of typesData) {
    types[type.moduleName] = type.code;
}

function App(): JSX.Element {

    return (
        <div className="demos-contailer">
            <PreviewerProvider
                code={codes.simple}
                types={types}
                className="demo"
            >
                <Previewer />
                <PreviewerEditor width="500px" height="400px" />
                <PreviewerError />
            </PreviewerProvider>

            <PreviewerProvider
                code={codes.components}
                types={types}
                className="demo"
                scope={{
                    "@byte-design/ui": components
                }}
            >
                <Previewer />
                <PreviewerEditor autoHeight width="500px" height="400px" />
                <PreviewerError />
            </PreviewerProvider>
        </div>
    );
}

export default App;
