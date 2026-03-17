import React from 'react';

const XSSTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Test XSS (vulnérable)</h2>
      <div dangerouslySetInnerHTML={{ __html: '<img src=x onerror=alert(1)>' }} />
    </div>
  );
};

export default XSSTest;