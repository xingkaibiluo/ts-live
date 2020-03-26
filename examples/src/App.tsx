import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {
  PreviewerProvider,
  Previewer,
  PreviewerEditor,
  PreviewerError
} from '@byte-design/react-previewer';
import './App.css';
import '@byte-design/react-previewer/style/index.css'


function App(): JSX.Element {
  const code = `
let num: number = 123;
export default function Demo(){
    return (
      <div>hello world</div>
    )
}
  `;

  return (
    <PreviewerProvider
      code={code}>
      <Previewer />
      <PreviewerEditor width="500px" height="300px" />
      <PreviewerError />
    </PreviewerProvider>
  );
}

export default App;
