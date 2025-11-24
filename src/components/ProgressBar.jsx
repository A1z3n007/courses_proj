import React from 'react';

// Индикатор прогресса с цветовым кодом.
export default function ProgressBar({ progress }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  let barColor = 'var(--progress-success)';
  if (clamped < 30) {
    barColor = 'var(--progress-danger)';
  } else if (clamped < 70) {
    barColor = 'var(--progress-warning)';
  }

  return (
    <div className="progress">
      <div className="progress__bar" style={{ width: `${clamped}%`, background: barColor }} />
    </div>
  );
}
