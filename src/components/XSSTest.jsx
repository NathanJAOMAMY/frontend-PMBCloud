import React from 'react';
import { useSearchParams } from 'react-router-dom';

const XSSTest = () => {
  const [searchParams] = useSearchParams();
  // Si aucun paramètre 'msg', on utilise un payload XSS par défaut
  const msg = searchParams.get('msg') || '<img src=x onerror=alert(1)>';
  return (
    <div style={{ padding: '20px' }}>
      <h2>Test XSS (vulnérable)</h2>
      <div dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
};

export default XSSTest;