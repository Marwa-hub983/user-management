import React from 'react';

const Loader = ({ fullPage = true, text = 'Loading...' }) => {
  const content = (
    <div className="loader-container">
      <div className="spinner"></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="full-page-loader">{content}</div>;
  }

  return content;
};

export default Loader;
