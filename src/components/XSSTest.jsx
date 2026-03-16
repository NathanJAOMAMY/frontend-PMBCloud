import React from 'react';
import { useSearchParams } from 'react-router-dom';

const XSSTest = () => {
  const [searchParams] = useSearchParams();
  const msg = searchParams.get('msg') || '';

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test XSS (vulnérable)</h2>
      <div dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
};

export default XSSTest;