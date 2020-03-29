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
        console.log('-----------Previewer useMemo')
        const codeDidRunCallback = (ret: any, compiledCode: string) => {
            const Preview = errorBoundary(ret.default, (err, errorInfo) => {
                const {
                    onError
                } = context.editorOptions;

                // 确保在 codeDidRun 执行完后再调用 onError
                setTimeout(() => {
                    onError && onError(err);
                }, 0);
            });

            ReactDOM.render(<Preview />, previewerRef.current);
        };

        context.codeDidRunCallbacks.push(codeDidRunCallback);
    }, []);

    const cls = classnames(className, 'rp-previewer');

    return (
        <div className={cls}>
            <div ref={previewerRef}></div>
        </div>
    );
}