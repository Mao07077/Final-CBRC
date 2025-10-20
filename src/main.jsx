import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Buffer polyfill for browser environments (some libraries expect Buffer)
// This uses a dynamic import so bundlers can tree-shake and avoid adding it when not needed.
(async function ensureBuffer() {
  if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
    try {
      const mod = await import('buffer');
      // CommonJS default or named export
      // eslint-disable-next-line no-param-reassign
      window.Buffer = mod?.Buffer || (mod?.default && mod.default.Buffer) || window.Buffer;
    } catch (err) {
      // If import fails, we silently continue; some environments won't need Buffer.
      // The error is logged for debugging.
      // console.warn('Buffer polyfill failed to load', err);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
})();
