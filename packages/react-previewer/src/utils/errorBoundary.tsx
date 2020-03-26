import React, {Component} from 'react';

export const errorBoundary = (Element: any, errorCallback: any) => {
    return class ErrorBoundary extends Component {
        componentDidCatch(error: Error) {
            console.log('----------componentDidCatch', error);
            errorCallback(error);
        }

        render() {
            console.log('----------element', Element);
            return typeof Element === 'function' ? <Element /> : Element;
        }
    };
};
