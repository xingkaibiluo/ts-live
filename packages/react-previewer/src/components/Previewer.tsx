import React, {useMemo, useRef, useContext} from 'react';
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
        const emitError = (err: Error) => {
            const {
                onError
            } = context.editorOptions;

            // 确保在 codeDidRun 执行完后再调用 onError
            setTimeout(() => {
                onError && onError(err);
            }, 0);
        };

        const codeDidRunCallback = (ret: any, compiledCode: string) => {
            const defaultExport = ret.default;

            if (!defaultExport) {
                emitError(new Error('Run results must be exported as default.'));

                return;
            }

            const Preview = errorBoundary(defaultExport, (err, errorInfo) => {
                emitError(err);
            });

            ReactDOM.render(<Preview />, previewerRef.current);
        };

        context.codeDidRunCallbacks.push(codeDidRunCallback);
    }, []);

    const cls = classnames(className, 'rp-previewer');

    return (
        <div className={cls} ref={previewerRef}>
        </div>
    );
}