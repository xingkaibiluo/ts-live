import React, {useMemo, useRef, useContext, useState} from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import {ProviderContext} from '../context/ProviderContext';
import {errorBoundary} from '../utils/errorBoundary';
import {
    IPreviewerProps
} from '../types';

export function Previewer(props: IPreviewerProps): JSX.Element {
    const {
        className
    } = props;
    const context = useContext(ProviderContext);
    const previewerRef = useRef<HTMLDivElement>(null);

    useMemo(() => {
        const {
            codeDidRun
        } = context.editorOptions;

        console.log('-----------Previewer useMemo')
        context.editorOptions.codeDidRun = (err: Error | null, ret: any, compiledCode: string) => {
            if (!err) {
                const Preview = errorBoundary(ret.default, (err, errorInfo) => {
                    console.log('----------render error', err, errorInfo);
                    codeDidRun && codeDidRun(err, ret, compiledCode);
                });

                ReactDOM.render(<Preview />, previewerRef.current);
            }

            if (codeDidRun) {
                codeDidRun(err, ret, compiledCode);
            }
        };
    }, []);

    const cls = classnames(className, 'rp-previewer');

    return (
        <div className={cls}>
            <div ref={previewerRef}></div>
        </div>
    );
}