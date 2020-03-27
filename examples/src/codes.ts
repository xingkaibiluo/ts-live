export default {
    simple: `
import React, {useMemo, useState, useContext} from 'react';

export default function Demo(){
    const [counter, setCounter] = useState<number>(0);

    return (
        <div>
        <button 
            onClick={()=>{
            setCounter(counter+1);
            }}
            style={{
            padding: 10
            }}
        >
            add
        </button>
        <div>{counter}</div>
        </div>
    )
}
    `,
    components: `
import React, { useState } from 'react';
import { RadioGroup, Tabs, TabSize } from '@byte-design/ui';

export default function Demo(): JSX.Element {
    const [size, setSize] = useState<TabSize>('md')

    const handleChange = (id: string): void => {
        console.log('click tab:' + id);
    };

    return (
        <div>
            <RadioGroup
                type="button"
                value={size}
                onChange={(value) => {
                    value && setSize(value);
                }}
            >
                <RadioGroup.Button value="lg">lg</RadioGroup.Button>
                <RadioGroup.Button value="md">md</RadioGroup.Button>
                <RadioGroup.Button value="sm">sm</RadioGroup.Button>
            </RadioGroup>

            <Tabs
                type="line"
                onChange={handleChange}
                size={size}
                activeId="1"
            >
                <Tabs.Item tab="tab 1" id="1" >
                    tab 1
                </Tabs.Item>
                <Tabs.Item tab="tab 2" id="2">
                    tab 2
                </Tabs.Item>
                <Tabs.Item tab="tab 3" id="3">
                    tab 3
                </Tabs.Item>
            </Tabs>
        </div>
    );
}
    `
}