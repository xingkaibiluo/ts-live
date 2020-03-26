import React, {useMemo, useState, useContext} from 'react';
import classnames from 'classnames';
import {ProviderContext} from '../context/ProviderContext';
import {
    IPreviewerErrorProps
} from '../types';

export function PreviewerError(props: IPreviewerErrorProps): JSX.Element {
    const {
        className
    } = props;
    const context = useContext(ProviderContext);
    const [error, setError] = useState<Error>();

    useMemo(() => {
        const {
            codeDidCompile,
            codeDidRun
        } = context.editorOptions;

        console.log('-----------PreviewerError useMemo')
        context.editorOptions.codeDidCompile = (err: Error | null, code: string, compiledCode: string) => {
            if (err) {
                setError(err);
            }
            if (codeDidCompile) {
                codeDidCompile(err, code, compiledCode);
            }
        };

        context.editorOptions.codeDidRun = (err: Error | null, ret: any, compiledCode: string) => {
            if (err) {
                setError(err);
            }
            if (codeDidRun) {
                codeDidRun(err, ret, compiledCode);
            }
        };
    }, []);

    const cls = classnames(className, 'rp-error');

    return (
        <div className={cls}>
            <pre>
                {error && error.message}
            </pre>
        </div>
    );
}