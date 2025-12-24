import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState('');

  const handleExtractData = async () => {
    setExtracting(true);
    setResult('');
    
    try {
      const response = await browser.runtime.sendMessage({ action: 'extractData' });
      setResult(response.result);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={handleExtractData} disabled={extracting}>
          {extracting ? 'Extracting...' : 'Extract Page Data'}
        </button>
        {result && (
          <div style={{ marginTop: '20px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
            <strong>Result:</strong>
            <p>{result}</p>
          </div>
        )}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  );
}

export default App;
