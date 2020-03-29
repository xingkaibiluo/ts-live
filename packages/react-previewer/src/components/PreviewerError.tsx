import React, {useMemo, useState, useContext} from 'react';
import classnames from 'classnames';
import {ProviderContext} from '../context/ProviderContext';
import {
    IPreviewerErrorProps
} from '../types';

export function PreviewerError(props: IPreviewerErrorProps): JSX.Element | null {
    const {
        className,
        onError,
        children
    } = props;
    const context = useContext(ProviderContext);
    const [error, setError] = useState<Error | null>();

    useMemo(() => {
        const {
            codeDidCompile,
            codeDidRun
        } = context.editorOptions;
        const emitError = (err: Error | null) => {
            setError(err);
            if (err && onError) {
                onError(err);
            }
        };

        console.log('-----------PreviewerError useMemo')
        context.editorOptions.codeDidCompile = (err: Error | null, code: string, compiledCode: string) => {
            emitError(err);
            if (codeDidCompile) {
                codeDidCompile(err, code, compiledCode);
            }
        };

        context.editorOptions.codeDidRun = (err: Error | null, ret: any, compiledCode: string) => {
            emitError(err);
            if (codeDidRun) {
                codeDidRun(err, ret, compiledCode);
            }
        };
    }, []);

    const cls = classnames(className, 'rp-error');

    if (!error) {
        return null;
    }

    return (
        <div className={cls}>
            {
                !children &&
                <pre>
                    {error.toString()}
                </pre>
            }
            {
                children && children
            }
        </div>
    );
}