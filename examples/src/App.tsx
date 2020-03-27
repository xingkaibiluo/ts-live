import React, {useState} from 'react';
import {
    PreviewerProvider,
    Previewer,
    PreviewerEditor,
    PreviewerError,
    ITypes,
    ThemeData,
    defineTheme,
    Editor
} from '@byte-design/react-previewer';
import '@byte-design/react-previewer/style/index.css';
import * as components from '@byte-design/ui';
import '@byte-design/ui/themes/platform/index.css';
import Demo from './Demo';
import typesData from './dts/types.json';
import active4d from './themes/active4d.json';
import amy from './themes/amy.json';
import github from './themes/github.json';
import codes from './codes';
import './App.css';

// 导入 types
const types: ITypes = {};
for (const type of typesData) {
    types[type.moduleName] = type.code;
}

// 自定义主题
defineTheme('active4d', active4d as ThemeData);
defineTheme('amy', amy as ThemeData);
defineTheme('github', github as ThemeData);

function App(): JSX.Element {
    const [showEditor, setShowEditor] = useState(false);
    const hideEditorCls = showEditor ? '' : 'editor--hidden';
    let delayEditorInstance: Editor | undefined;

    return (
        <div className="demos-contailer">
            <Demo title="react demo">
                <PreviewerProvider
                    code={codes.react}
                    editorDidCreate={(editor) => {
                        console.log('editorDidCreate...')
                    }}
                    className="flex-demo"
                >
                    <div className="flex-demo-main">
                        <PreviewerEditor width="600px" height="400px" />
                        <Previewer />
                    </div>
                    <PreviewerError />
                </PreviewerProvider>
            </Demo>

            <Demo title="@byte-design/ui demo">
                <PreviewerProvider
                    code={codes.components}
                    types={types}
                    scope={{
                        "@byte-design/ui": components
                    }}
                    className="flex-demo"
                    codeDidCompile={(err, code, compiledCode) => {
                    }}
                >
                    <div className="flex-demo-main">
                        <Previewer />
                        <PreviewerEditor autoHeight width="600px" />
                    </div>
                    <PreviewerError />
                </PreviewerProvider>
            </Demo>

            <Demo title="delayInit demo">
                <PreviewerProvider
                    code={codes.delay.code}
                    compiledCode={codes.delay.compiledCode}
                    types={types}
                    scope={{
                        "@byte-design/ui": components
                    }}
                    delayInit
                    getEditor={(editor) => {
                        delayEditorInstance = editor;
                    }}
                >
                    <Previewer />
                    <div className="edittor-toggle" onClick={() => {
                        delayEditorInstance && delayEditorInstance.init();
                        setShowEditor(!showEditor);
                    }}>
                        > 代码编辑器
                    </div>
                    <PreviewerEditor className={hideEditorCls} autoHeight width="600px" />
                    <PreviewerError />
                </PreviewerProvider>
            </Demo>

            <Demo title="自定义主题">
                <PreviewerProvider
                    code={codes.components}
                    types={types}
                    scope={{
                        "@byte-design/ui": components
                    }}
                    editorOptions={{
                        // 使用 defineTheme 定义后的主题
                        theme: 'github'
                    }}
                    className="flex-demo"
                >
                    <div className="flex-demo-main">
                        <PreviewerEditor width="640px" height="400px" />
                        <Previewer />
                    </div>
                    <PreviewerError />
                </PreviewerProvider>
            </Demo>

            <Demo title="delayInit demo">
            </Demo>

            <Demo title="computedCode demo">
            </Demo>

        </div>
    );
}

export default App;
