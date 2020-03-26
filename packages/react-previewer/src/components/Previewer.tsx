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
    const [Element, setElement] = useState('');

    useMemo(() => {
        const {
            codeDidRun
        } = context.editorOptions;

        console.log('-----------Previewer useMemo')
        context.editorOptions.codeDidRun = (err: Error | null, ret: any, compiledCode: string) => {
            if (!err) {
                const Preview = ret.default;
                setElement(Preview)
                // ReactDOM.render(<Preview />, previewerRef.current, () =>{

                // });
            }

            if (codeDidRun) {
                codeDidRun(err, ret, compiledCode);
            }
        };
    }, []);

    const cls = classnames(className, 'rp-previewer');
    const Elements = errorBoundary(Element, (err: Error) => {
        console.log('----------render error', err)
    });

    return (
        <div className={cls}>
            <Elements />
            <div ref={previewerRef}>

            </div>
        </div>
    );
}