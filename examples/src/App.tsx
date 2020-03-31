import React, {useState, useRef} from 'react';
import {
    PreviewerProvider,
    Previewer,
    PreviewerEditor,
    PreviewerError,
    ThemeData,
    defineTheme,
    setTheme,
    ITypes,
    Editor
} from '@ts-live/react-previewer';
import '@ts-live/react-previewer/style/index.css';
import * as components from '@byte-design/ui';
import {RadioGroup} from '@byte-design/ui';
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
    const delayEditorRef = useRef<Editor>();
    const [showEditor, setShowEditor] = useState(false);
    const [theme, setThemeValue] = useState('github');

    const hideEditorCls = showEditor ? '' : 'editor--hidden';

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
                        <PreviewerEditor width={600} height={400} />
                        <Previewer />
                    </div>
                    <PreviewerError
                        renderError={(err: Error | null) => {
                            if (!err) {
                                return null;
                            }
                            return (
                                <div style={{color: 'red'}}>
                                    {err.message}
                                </div>
                            )
                        }}
                    />
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
                    codeDidCompile={(code, compiledCode) => {
                    }}
                >
                    <div className="flex-demo-main">
                        <Previewer />
                        <PreviewerEditor
                            width={600}
                            autoHeight
                            minHeight={300}
                        />
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
                >
                    <Previewer />
                    <div className="edittor-toggle" onClick={() => {
                        // 如果设置了 delayInit，需要手动 init
                        if (delayEditorRef.current) {
                            delayEditorRef.current.init();
                        }
                        setShowEditor(!showEditor);
                    }}>
                        > 代码编辑器
                    </div>
                    <PreviewerEditor
                        className={hideEditorCls}
                        autoHeight
                        width={600}
                        getEditor={(editor) => {
                            delayEditorRef.current = editor;
                        }}
                    />
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
                        theme
                    }}
                    className="flex-demo"
                >
                    <RadioGroup
                        type="button"
                        value={theme}
                        onChange={(value) => {
                            if (value) {
                                setThemeValue(value);
                                setTheme(value);
                            }
                        }}
                        style={{marginBottom: 10}}
                    >
                        <RadioGroup.Button value="github">github</RadioGroup.Button>
                        <RadioGroup.Button value="active4d">active4d</RadioGroup.Button>
                        <RadioGroup.Button value="amy">amy</RadioGroup.Button>
                    </RadioGroup>
                    <div className="flex-demo-main">
                        <PreviewerEditor width={600} height={400} />
                        <Previewer />
                    </div>
                    <PreviewerError />
                </PreviewerProvider>
            </Demo>

        </div>
    );
}

export default App;
