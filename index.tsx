import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is disabled here because Blockly double-initialization in dev mode can be tricky
  // without extensive cleanup logic, though we implement cleanup in the component.
  // Enabling it is fine for production but can cause visual glitches in dev hot-reloading.
  <App />
);