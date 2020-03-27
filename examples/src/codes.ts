export default {
    simple: `
import {InputNumber} from '@byte-design/ui';
import React, {useState} from 'react';

export default () => {
    const [value, setValue] = useState(1);
    const handleChange = (val: number) => {
        return setValue(val);
    };
    return (
        <InputNumber
            onChange={handleChange}
            placeholder="请输入1-20之间的数字"
            max={20}
            min={1}
            strict={true}
            value={value}
        />
    );
};
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
    `
}