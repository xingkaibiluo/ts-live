# `react-previewer`

> typescript 编辑器，可以实时编译、运行代码并生成预览效果。

## Usage

### 安装：

```bash
npm i react-previewer
```

### Demo

使用时需要先手动引入一下 `monaco-editor` 的 `worker`，该 worker 位于 `ts-editor` 包下的 `workers` 目录，加载 worker 时如果碰到跨域问题，可参考[monaco 文档](https://github.com/microsoft/monaco-editor/blob/master/docs/integrate-amd-cross.md)：

```html
// ./index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Previewer Demo</title>
    <script>
        window.MonacoEnvironment = {
            // getWorkerUrl 返回的是 worker 的路径，monaco 会通过该路径去加载 worker，所以要确保路径正确。
            getWorkerUrl: function (moduleId, label) {
                if (label === "json") {
                    return "./worker/json.worker.js";
                }
                if (label === "css") {
                    return "./worker/css.worker.js";
                }
                if (label === "html") {
                    return "./worker/html.worker.js";
                }
                if (label === "typescript" || label === "javascript") {
                    return "./worker/ts.worker.js";
                }
                return "./worker/editor.worker.js";
            }
        };
    </script>
</head>

<body>
  <div id="root"></div>
</body>

</html>
```

```jsx
import {
    PreviewerProvider,
    Previewer,
    PreviewerEditor,
    PreviewerError
} from '@ts-live/react-previewer';

<PreviewerProvider
    code={'<strong>Hello World!</strong>'}
>
    <Previewer />
    <PreviewerEditor
        autoHeight
        width="600px"
    />
    <PreviewerError />
</PreviewerProvider>
```

更多使用 demo 可参考 `./examples`。

## API

### &lt;PreviewerProvider/&gt;

|参数|说明|类型|默认值|
|---|---|---|---|
| className | 自定义class name | string | -- |

`PreviewerProvider` 的 props 还支持 `@ts-live/ts-editor` 包的 `IEditorOptions` 所有[选项](../ts-editor)。

### &lt;PreviewerEditor/&gt;

|参数|说明|类型|默认值|
|---|---|---|---|
| width | 编辑器宽度 | string | -- |
| height | 编辑器高度 | string | 0 |
| autoHeight | 编辑器是否自适应内容高度 | boolean | false |
| minHeight | autoHeight 为 true 时，编辑器最小高度 | number | 0 |
| maxHeight | autoHeight 为 true 时，编辑器最大高度，为 0 时表示不限制高度 | number | 0 |
| getEditor | 获取 editor 实例 | (editor: Editor) => void | -- |
| className | 自定义class name | string | -- |

### &lt;Previewer/&gt;

|参数|说明|类型|默认值|
|---|---|---|---|
| renderError | 当有错误时，自定义渲染 error | (error: Error | null) => JSX.Element | null | -- |
| className | 自定义class name | string | -- |

### &lt;PreviewerError/&gt;

|参数|说明|类型|默认值|
|---|---|---|---|
| className | 自定义class name | string | -- |
