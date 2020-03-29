export default {
    react: `
import React, {useMemo, useState, useContext} from 'react';

export default function Demo(){
    const [counter, setCounter] = useState<number>(0);

    return (
        <div>
            <div className="demo-counter">{counter}</div>
            <button 
                onClick={()=>{
                    setCounter(counter+1);
                }}
                className="demo-button"
            >
                add
            </button>
        </div>
    )
}
    `,
    components: `
import {Switch} from '@byte-design/ui';
import React, { useState, useCallback, Fragment } from 'react';

export default function RadioDemo() {
    const [checked, setChecked]  = useState(true);
    const handleChange=useCallback((v: boolean) => {
        setChecked(v);
    }, []);

    return (
        <Fragment>
            <Switch
                style={{marginRight: '20px'}}
                size="lg"
                checked={checked}
                onValueChange={handleChange}/>
            <Switch
                style={{marginRight: '20px'}}
                size="md"
                checked={checked}
                onValueChange={handleChange}/>
            <Switch
                size="sm"
                checked={checked}
                onValueChange={handleChange}/>
        </Fragment>
    );
};
    `,
    delay: {
        code: `
import {Pager} from '@byte-design/ui';
import React, {Fragment, useState} from 'react';
import './index.less';

export default function Demo() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const onPageChange = (index: number) => {
        setPage(index);
    };

    const onPageSizeChange = (index: number, pageSize: number) => {
        setPage(index);
        setPageSize(pageSize);
    };
    return (
        <Fragment>
            <Pager
                page={page}
                total={538}
                pageSize={pageSize}
                pageSizeList={[10, 20, 30, 40, 50]}
                onPageSizeChange={onPageSizeChange}
                onPageChange={onPageChange}
            />
        </Fragment>
    );
}
        `,
        compiledCode: `
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("@byte-design/ui");
const react_1 = __importStar(require("react"));
require("./index.less");
function Demo() {
    const [page, setPage] = react_1.useState(1);
    const [pageSize, setPageSize] = react_1.useState(10);
    const onPageChange = (index) => {
        setPage(index);
    };
    const onPageSizeChange = (index, pageSize) => {
        setPage(index);
        setPageSize(pageSize);
    };
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement(ui_1.Pager, { page: page, total: 538, pageSize: pageSize, pageSizeList: [10, 20, 30, 40, 50], onPageSizeChange: onPageSizeChange, onPageChange: onPageChange })));
}
exports.default = Demo;
        `
    }
}