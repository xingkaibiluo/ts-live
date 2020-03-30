import React, {Component, ErrorInfo} from 'react';

export interface IState {
    hasError: boolean;
}

export interface IProps {}

export const errorBoundary = (Element: any, errorCallback: (error: Error, errorInfo: ErrorInfo) => void) => {
    return class ErrorBoundary extends Component {
        state: IState;

        constructor(props: IProps) {
            super(props);
            this.state = {hasError: false};
        }

        static getDerivedStateFromError(error: Error) {
            // 更新 state 使下一次渲染能够显示降级后的 UI
            return {hasError: true};
        }

        componentDidCatch(error: Error, errorInfo: ErrorInfo) {
            errorCallback(error, errorInfo);
        }

        render() {
            if (this.state.hasError) {
                return null;
            }
            return typeof Element === 'function' ? <Element /> : Element;
        }
    };
};
