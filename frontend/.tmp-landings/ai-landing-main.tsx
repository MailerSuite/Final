import React from react;
import { createRoot } from react-dom/client;
import { MemoryRouter } from react-router-dom;
import Component from ../archives/pages-unused/landing/ai-landing/index.tsx;
const root = createRoot(document.getElementById(root)!);
root.render(
  <React.StrictMode>
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  </React.StrictMode>
);
