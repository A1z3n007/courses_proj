import React from 'react';

// A simple progress bar component that displays the percentage completed.
export default function ProgressBar({ progress }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  // Choose a color based on progress percentage: red for <30%, yellow for 30–69%, green otherwise.
  let barColor = '#4caf50';
  if (clamped < 30) {
    barColor = '#f44336';
  } else if (clamped < 70) {
    barColor = '#ffc107';
  }
  return (
    <div style={{ background: '#eee', borderRadius: '4px', overflow: 'hidden', height: '10px' }}>
      <div
        style={{
          width: `${clamped}%`,
          background: barColor,
          height: '100%',
        }}
      />
    </div>
  );
}