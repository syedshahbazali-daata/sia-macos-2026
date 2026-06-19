import React, { useState, useEffect } from 'react';
import OnboardCardLayout from '../components/OnboardCardLayout';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@renderer/redux/store';

const BrowserDownload: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const instances = useSelector((state: RootState) => state.instance.instances);
  const selectedId = useSelector((state: RootState) => state.selectedInstance.instanceId);

  useEffect(() => {
    window.electron.ipcRenderer.send('browser-exists', '');

    window.electron.ipcRenderer.once('browser-exists-response', (event, browserExists) => {
      if (browserExists) {
        setLoading(false);
        navigateToNextScreen();
      }
    });

    // Clean up listeners
    return () => {
      window.electron.ipcRenderer.removeAllListeners('download-progress');
      window.electron.ipcRenderer.removeAllListeners('download-browser-complete');
      window.electron.ipcRenderer.removeAllListeners('download-browser-error');
    };
  }, []);

  const navigateToNextScreen = () => {
    if (selectedId) {
      navigate('/dashboard');
    } else if (instances.length === 0) {
      navigate('/instance/create');
    } else {
      navigate('/instance');
    }
  };

  const handleClick = () => {
    setLoading(true);
    setProgress(0);
    window.electron.ipcRenderer.send('download-browser', '');

    // Listen for progress updates
    window.electron.ipcRenderer.on('download-progress', (_, percentage) => {
      setProgress(percentage);
    });

    // Listen for completion
    window.electron.ipcRenderer.once('download-browser-complete', () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        navigateToNextScreen();
      }, 500);
    });

    // Listen for errors
    window.electron.ipcRenderer.once('download-browser-error', (error) => {
      console.error('Download error:', error);
      setLoading(false);
      setProgress(0);
    });

    return false;
  };

  return (
    <div className="flex flex-col items-center">
      <OnboardCardLayout
        heading="Download Browser"
        paragraph="Click on the button to download the browser."
        btnText={loading ? `Downloading ${progress.toFixed(1)}%` : 'Download'}
        onClick={handleClick}
        loading={loading}
      />

      {loading && (
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-4">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default BrowserDownload;
