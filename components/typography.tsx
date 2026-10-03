import React from 'react';

// Wraps with the CSS font variable classes
export function nextFont(children: React.ReactNode) {
  return <div className="font-sans antialiased">{children}</div>;
}
