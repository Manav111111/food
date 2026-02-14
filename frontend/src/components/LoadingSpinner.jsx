import React from 'react';

export default function LoadingSpinner({ message = 'Analyzing your food...' }) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <span className="loading-text">{message}</span>
    </div>
  );
}
