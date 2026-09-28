import React from 'react';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <div className="error-content">
        <svg
          className="error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{message}</span>
      </div>
      {onClose && (
        <button type="button" className="error-close-btn" onClick={onClose} aria-label="Close error">
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
