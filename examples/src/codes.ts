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
    `
}