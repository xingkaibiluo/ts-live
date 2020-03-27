import React, {ReactNode} from 'react';
import {Card} from '@byte-design/ui';
import './Demo.css';

export interface IProps {
    title: string;
    children: ReactNode;
}

export default function Demo(props: IProps): JSX.Element {
    const {
        title,
        children
    } = props;

    return (
        <div className="demo-block">
            <Card
                title={title}
                style={{width: '100%'}}
            >
                {children}
            </Card>
        </div>
    );
}