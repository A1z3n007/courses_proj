import React from 'react';

export default function Loader({ label = 'Загружаем...' }) {
  return (
    <div className="loader-screen" role="status" aria-live="polite">
      <div className="loader-spinner" />
      <p>{label}</p>
    </div>
  );
}
