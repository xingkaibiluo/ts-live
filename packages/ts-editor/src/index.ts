export {
    Editor,
    IEditorOptions
} from './lib/Editor';

import * as monaco from 'monaco-editor';
import "monaco-editor/esm/vs/editor/editor.worker.js";
import "monaco-editor/esm/vs/language/json/json.worker";
import "monaco-editor/esm/vs/language/css/css.worker";
import "monaco-editor/esm/vs/language/html/html.worker";
import "monaco-editor/esm/vs/language/typescript/ts.worker";

export {monaco};

// @ts-ignore
window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
        if (label === "json") {
            return "./json.worker.bundle.js";
        }
        if (label === "css") {
            return "./css.worker.bundle.js";
        }
        if (label === "html") {
            return "./html.worker.bundle.js";
        }
        if (label === "typescript" || label === "javascript") {
            return "./ts.worker.bundle.js";
        }
        return "./editor.worker.bundle.js";
    }
};
