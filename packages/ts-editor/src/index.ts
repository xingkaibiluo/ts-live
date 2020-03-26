export {
    Editor,
    IEditorOptions
} from './lib/Editor';

import * as monaco from 'monaco-editor';
// import "monaco-editor/esm/vs/editor/editor.worker";
// import "monaco-editor/esm/vs/language/json/json.worker";
// import "monaco-editor/esm/vs/language/css/css.worker";
// import "monaco-editor/esm/vs/language/html/html.worker";
export {monaco};

const jsonWorker = require("monaco-editor/esm/vs/language/json/json.worker.js")
const tsWorker = require("monaco-editor/esm/vs/language/typescript/ts.worker.js")
const cssWorker = require("monaco-editor/esm/vs/language/css/css.worker.js")
const htmlWorker = require("monaco-editor/esm/vs/language/html/html.worker.js")
const Worker = require("monaco-editor/esm/vs/editor/editor.worker")

// @ts-ignore
window.MonacoEnvironment = {
    // getWorker: (moduleId: string, label: string) => {
    //     console.log('-------------getWorker', moduleId, label)
    //     if (label === "json") {
    //         return new jsonWorker();
    //     }
    //     if (label === "css") {
    //         return new cssWorker();
    //     }
    //     if (label === "html") {
    //         return new htmlWorker();
    //     }
    //     if (label === "typescript" || label === "javascript") {
    //         console.log('-------------getWorker typescript', tsWorker)
    //         return new tsWorker();
    //     }
    //     return new Worker();
    // },
    getWorkerUrl: function (moduleId: string, label: string) {
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
