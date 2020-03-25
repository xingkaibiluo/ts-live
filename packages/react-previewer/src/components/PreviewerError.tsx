import React, {useEffect, useRef} from 'react';
import classnames from 'classnames';

export function PreviewerError(): JSX.Element {
    const cls = classnames('rp-error');

    return (
        <div className={cls}>
            error...
        </div>
    );
}