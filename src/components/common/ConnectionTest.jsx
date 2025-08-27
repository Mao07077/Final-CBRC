import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

const ConnectionTest = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic backend connection
        const response = await apiClient.get('/');
        setStatus('✅ Backend connected successfully!');
        setBackendData(response.data);
      } catch (error) {
        setStatus(`❌ Backend connection failed: ${error.message}`);
        console.error('Connection error:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Frontend-Backend Connection Test</h3>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Frontend URL:</strong> http://localhost:5173</p>
      <p><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}</p>
      {backendData && (
        <div>
          <h4>Backend Response:</h4>
          <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(backendData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
