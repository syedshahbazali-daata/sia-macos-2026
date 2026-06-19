import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  YoutubeIcon, InstagramIcon, TwitterIcon, TwitchIcon,
  Loader2Icon, CameraIcon, MicIcon, Settings,
  RefreshCwIcon, SaveIcon, AlertCircle
} from "lucide-react";
import {toast} from '@renderer/hooks/use-toast';
import logo from '@renderer/assets/logo.svg';
import LiveChat from './components/LiveChat';

// Stream URL configuration
const STREAM_URLS = {
  twitter: (key: string) => `rtmp://in.pscp.tv:80/x//${key}`,
  instagram: (key: string) => `rtmps://edgetee-upload-mct1-1.xx.fbcdn.net:443/rtmp/${key}`,
  twitch: (key: string) => `rtmp://live-jfk.twitch.tv/app/${key}`,
  youtube: (key: string) => `rtmp://a.rtmp.youtube.com/live2/${key}`
};

// Interfaces
interface InstanceStreamKeys {
  [instanceId: string]: {
    [platform: string]: string;
  };
}

interface AttachedAccountsEntry {
  [instanceId: string]: string[];
}

interface LiveStatus {
  youtube: boolean;
  instagram: boolean;
  twitter: boolean;
  twitch: boolean;
}

interface StreamHealth {
  buffering: boolean;
  dropped: number;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface PlatformButtonProps {
  platform: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

// Platform configuration
const PLATFORM_STATUS = {
  youtube: {
    name: 'YouTube',
    available: true,
    icon: YoutubeIcon,
  },
  instagram: {
    name: 'Instagram',
    available: true,
    icon: InstagramIcon,
    message: 'Instagram streaming integration is coming soon!',
  },
  twitter: {
    name: 'Twitter',
    available: true,
    icon: TwitterIcon,
  },
  twitch: {
    name: 'Twitch',
    available: true,
    icon: TwitchIcon,
    message: 'Twitch integration is under development.',
  },
};

const LivegateNow = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Core states
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeClass, setActiveClass] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedUnavailablePlatform, setSelectedUnavailablePlatform] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Stream management states
  const [instanceStreamKeys, setInstanceStreamKeys] = useState<InstanceStreamKeys>({});
  const [attachedAccounts, setAttachedAccounts] = useState<AttachedAccountsEntry[]>([]);
  const [currentInstanceId, setCurrentInstanceId] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [currentStreamKey, setCurrentStreamKey] = useState('');
  const [_isEditingKey, setIsEditingKey] = useState(false);

  // Device states
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<DeviceInfo | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<DeviceInfo | null>(null);

  const [health, setHealth] = useState<StreamHealth>({buffering: false, dropped: 0});
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({
    youtube: false,
    instagram: false,
    twitter: false,
    twitch: false
  });

  // Check if platform is attached for current instance
  const isPlatformAttached = useCallback((platform: string) => {
    const instanceAccount = attachedAccounts.find(acc => Object.keys(acc)[0] === currentInstanceId);
    if (!instanceAccount) return false;
    return instanceAccount[currentInstanceId].includes(platform);
  }, [attachedAccounts, currentInstanceId]);

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load instance data
  useEffect(() => {
    const loadData = async () => {
      try {
        const instanceId = localStorage.getItem('selectedInstanceId');
        if (!instanceId) {
          console.error('No instance ID found');
          return;
        }

        setCurrentInstanceId(instanceId);

        // Remove listeners before adding new ones
        window.electron.ipcRenderer.removeAllListeners('attached-accounts');

        const streamKeysResponse = await window.electron.ipcRenderer.invoke('read-json-file', 'STREAM_KEYS');
        const accountsResponse = await window.electron.ipcRenderer.invoke('read-json-file', 'ATTACHED_ACCOUNTS');

        if (Array.isArray(streamKeysResponse) && streamKeysResponse.length > 0) {
          const instanceData = streamKeysResponse[0];
          setInstanceStreamKeys(instanceData);

          const currentKeys = instanceData[instanceId] || {};
          if (currentKeys[selectedPlatform]) {
            setCurrentStreamKey(currentKeys[selectedPlatform]);
          }
        }

        if (accountsResponse && Array.isArray(accountsResponse)) {
          setAttachedAccounts(accountsResponse);
        }
      } catch (error) {
        console.error('Error loading instance data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load configuration data',
          variant: 'destructive'
        });
      }
    };

    loadData();

    return () => {
      window.electron.ipcRenderer.removeAllListeners('attached-accounts');
    };
  }, [selectedPlatform]);

  // Device management
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({deviceId: device.deviceId, label: device.label}));

      const audioDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({deviceId: device.deviceId, label: device.label}));

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      if (!selectedCamera && videoDevices.length) {
        setSelectedCamera(videoDevices[0]);
      }
      if (!selectedMicrophone && audioDevices.length) {
        setSelectedMicrophone(audioDevices[0]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Device Error',
        description: 'Failed to fetch available devices',
        variant: 'destructive'
      });
    }
  }, [selectedCamera, selectedMicrophone]);

  // Media setup
  useEffect(() => {
    let mounted = true;

    const setupMedia = async () => {
      try {
        const constraints = {
          video: selectedCamera ? {deviceId: {exact: selectedCamera.deviceId}} : true,
          audio: selectedMicrophone ? {deviceId: {exact: selectedMicrophone.deviceId}} : true
        };

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsVideoLoading(false);
        }

        await getDevices();
      } catch (error) {
        console.error('Media setup error:', error);
        setIsVideoLoading(false);
        toast({
          title: 'Setup Error',
          description: error instanceof Error ? error.message : 'Unable to access media devices',
          variant: 'destructive'
        });
      }
    };

    setupMedia();

    return () => {
      mounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedCamera, selectedMicrophone, getDevices]);

  // Settings handlers
  const handleLogoMouseDown = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setShowSettings(true);
    }, 1000);
  };

  const handleLogoMouseUp = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    const instanceKeys = instanceStreamKeys[currentInstanceId] || {};
    setCurrentStreamKey(instanceKeys[platform] || '');
  };

  const handleStreamKeyUpdate = async () => {
    if (!currentInstanceId) {
      toast({
        title: 'Update Error',
        description: 'No instance selected',
        variant: 'destructive'
      });
      return;
    }

    try {
      const streamKeysResponse = await window.electron.ipcRenderer.invoke('read-json-file', 'STREAM_KEYS');
      let existingData = Array.isArray(streamKeysResponse) ? streamKeysResponse : [];

      let instanceObj = existingData.find(obj => Object.keys(obj)[0] === currentInstanceId);

      if (!instanceObj) {
        instanceObj = {[currentInstanceId]: {}};
        existingData.push(instanceObj);
      }

      instanceObj[currentInstanceId] = {
        ...instanceObj[currentInstanceId],
        [selectedPlatform]: currentStreamKey
      };

      await window.electron.ipcRenderer.invoke('write-json-file', 'STREAM_KEYS', existingData);

      setInstanceStreamKeys(prev => ({
        ...prev,
        [currentInstanceId]: {
          ...prev[currentInstanceId],
          [selectedPlatform]: currentStreamKey
        }
      }));

      setIsEditingKey(false);
      

      toast({
        title: 'Stream Key Updated',
        description: `Stream key for ${PLATFORM_STATUS[selectedPlatform].name} has been updated.`,
      });

      // app should be on top

    } catch (error) {
      console.error('Error updating stream key:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update stream key',
        variant: 'destructive'
      });
    }
  };

  const handleAutoFetch = async () => {
    if (!isPlatformAttached(selectedPlatform)) {
      return;
    }

    try {
      const streamKey = await window.electron.ipcRenderer.invoke(
        'fetch-stream-key',
        selectedPlatform,
        currentInstanceId
      );

      if (streamKey) {
        setCurrentStreamKey(streamKey);
        setIsEditingKey(true);

        const streamKeysResponse = await window.electron.ipcRenderer.invoke('read-json-file', 'STREAM_KEYS');
        let existingData = Array.isArray(streamKeysResponse) ? streamKeysResponse : [];

        let instanceObj = existingData.find(obj => Object.keys(obj)[0] === currentInstanceId);
        if (!instanceObj) {
          instanceObj = {[currentInstanceId]: {}};
          existingData.push(instanceObj);
        }

        instanceObj[currentInstanceId] = {
          ...instanceObj[currentInstanceId],
          [selectedPlatform]: streamKey
        };

        await window.electron.ipcRenderer.invoke('write-json-file', 'STREAM_KEYS', existingData);

        setInstanceStreamKeys(prev => ({
          ...prev,
          [currentInstanceId]: {
            ...prev[currentInstanceId],
            [selectedPlatform]: streamKey
          }
        }));

        toast({
          title: `${selectedPlatform} Stream Key Fetched`,
          description: 'Stream key has been fetched and is ready to use.',
        });
      } else {
        toast({
          title: 'Stream Key Fetch Error',
          description: 'Failed to fetch stream key. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching stream key:', error);
      toast({
        title: 'Stream Key Fetch Error',
        description: 'Failed to fetch stream key',
        variant: 'destructive'
      });
    }
  };

  // Platform selection handler
  const handlePlatformToggle = useCallback((platform: string) => {
    if (isLive) return;

    if (!PLATFORM_STATUS[platform].available) {
      setSelectedUnavailablePlatform(platform);
      setShowUnavailableModal(true);
      return;
    }

    const instanceKeys = instanceStreamKeys[currentInstanceId] || {};

    if (!instanceKeys[platform]) {
      setSelectedPlatform(platform);
      setCurrentStreamKey('');
      setShowSettings(true);
      return;
    }

    setLiveStatus(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  }, [isLive, instanceStreamKeys, currentInstanceId]);

  // Streaming handlers
  const handleGoLive = useCallback(async () => {
    if (!mediaStreamRef.current || !currentInstanceId) {
      toast({
        title: 'Stream Error',
        description: 'No media access or instance selected',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const instanceKeys = instanceStreamKeys[currentInstanceId] || {};
      const activeStreams = Object.entries(liveStatus)
        .filter(([platform, isActive]) => isActive && PLATFORM_STATUS[platform].available)
        .map(([platform]) => ({
          id: platform,
          streamUrl: STREAM_URLS[platform](instanceKeys[platform])
        }));

      // ... [Previous code remains exactly the same until handleGoLive]

      if (activeStreams.length === 0) {
        toast({
          title: 'No Streams Selected',
          description: 'Please select at least one platform',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const buffer = await event.data.arrayBuffer();
            activeStreams.forEach(stream => {
              if (liveStatus[stream.id]) {
                window.api.sendStreamData(stream.id, buffer);
              }
            });
          } catch (error) {
            console.error('Stream data error:', error);
            setHealth(prev => ({
              ...prev,
              dropped: prev.dropped + 1
            }));
          }
        }
      };

      for (const stream of activeStreams) {
        try {
          await window.api.startStream(stream.id, stream.streamUrl);
        } catch (error) {
          console.error(`Stream start error ${stream.id}:`, error);
          setLiveStatus(prev => ({
            ...prev,
            [stream.id]: false
          }));
          toast({
            title: `Stream Error - ${stream.id}`,
            description: error instanceof Error ? error.message : 'An unknown error occurred',
            variant: 'destructive'
          });
        }
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setIsLive(true);
      setActiveClass(true);
    } catch (error) {
      console.error('Stream start error:', error);
      toast({
        title: 'Stream Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [liveStatus, instanceStreamKeys, currentInstanceId]);

  const handleStopLive = useCallback(async () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      Object.entries(liveStatus)
        .filter(([_, isActive]) => isActive)
        .forEach(([platform]) => {
          window.api.stopStream(platform);
        });

      setIsLive(false);
      setActiveClass(false);
      setLiveStatus({
        youtube: false,
        instagram: false,
        twitter: false,
        twitch: false
      });
      setHealth({
        buffering: false,
        dropped: 0
      });
    } catch (error) {
      console.error('Stream stop error:', error);
      toast({
        title: 'Stop Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  }, [liveStatus]);

  // Mobile warning
  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md text-center">
          <h2 className="text-xl font-bold text-[#14263A] mb-4">Device Not Supported</h2>
          <p className="text-gray-600">
            This application is optimized for larger screens. Please access it from a tablet, laptop, or desktop
            computer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 z-[1]">
      {/* Loading overlay */}
      {isVideoLoading && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <Loader2Icon className="w-8 h-8 text-white animate-spin"/>
        </div>
      )}

      {/* Media source indicators */}
      <div
        className="absolute top-4 left-4 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-white/70 backdrop-blur-sm p-2 rounded-md">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-5 h-5"/>
          <span className="text-sm truncate max-w-[200px]">{selectedCamera?.label || 'No camera'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MicIcon className="w-5 h-5"/>
          <span className="text-sm truncate max-w-[200px]">{selectedMicrophone?.label || 'No microphone'}</span>
        </div>
      </div>

      <video
        ref={videoRef}
        className="absolute top-0 right-0 left-0 w-full h-full object-cover z-[2]"
        muted
        playsInline
        autoPlay
      />

      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center w-full h-full z-10 relative">
        <div className="border-2 border-white w-full h-full z-20 relative">
          <div className={`flex ${activeClass ? 'justify-start' : 'justify-center'} items-end w-full h-full`}>
            {activeClass && <LiveChat/>}
            <div
              className={`${activeClass ? 'xl:ml-[16%] lg:ml-[6%] md:ml-[3%]' : ''} w-auto md:w-80 bg-white/70 backdrop-blur-sm px-4 py-2 z-10 rounded-ss-xl rounded-se-xl border border-white`}>
              <div className="flex gap-3 md:gap-6 items-center">
                <PlatformButton
                  platform="youtube"
                  active={liveStatus.youtube}
                  disabled={isLive}
                  onClick={() => handlePlatformToggle('youtube')}
                />
                <PlatformButton
                  platform="instagram"
                  active={liveStatus.instagram}
                  disabled={isLive}
                  onClick={() => handlePlatformToggle('instagram')}
                />

                <button
                  onMouseDown={handleLogoMouseDown}
                  onMouseUp={handleLogoMouseUp}
                  onMouseLeave={handleLogoMouseUp}
                  onClick={() => isLive ? handleStopLive() : handleGoLive()}
                  className="flex items-center justify-center gap-1 transition-transform hover:scale-110 focus:outline-none bg-[#14263A] p-2 rounded-full hover:bg-[#14263A]/70 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin text-white"/>
                  ) : isLive ? (
                    <p className="text-white font-medium text-xs text-nowrap px-1 py-[2px]">
                      Stop Live
                    </p>
                  ) : (
                    <img src={logo} alt="Logo" className="w-6 h-6"/>
                  )}
                </button>

                <PlatformButton
                  platform="twitter"
                  active={liveStatus.twitter}
                  disabled={isLive}
                  onClick={() => handlePlatformToggle('twitter')}
                />
                <PlatformButton
                  platform="twitch"
                  active={liveStatus.twitch}
                  disabled={isLive}
                  onClick={() => handlePlatformToggle('twitch')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stream health indicators */}
      {isLive && (health.buffering || health.dropped > 0) && (
        <div className="absolute top-4 right-4 space-y-2">
          {health.buffering && (
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
              Buffering...
            </div>
          )}
          {health.dropped > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              Dropped Frames: {health.dropped}
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-md w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#14263A]">Livegate Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-5 h-5"/>
              </button>
            </div>

            <div className="space-y-6">
              {/* Media Devices Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-[#14263A]">Media Devices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera
                    </label>
                    <select
                      value={selectedCamera?.deviceId || ''}
                      onChange={(e) => {
                        const device = cameras.find(d => d.deviceId === e.target.value);
                        setSelectedCamera(device || null);
                      }}
                      className="w-full p-2 border rounded-md bg-white/90"
                    >
                      {cameras.map(camera => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Microphone
                    </label>
                    <select
                      value={selectedMicrophone?.deviceId || ''}
                      onChange={(e) => {
                        const device = microphones.find(d => d.deviceId === e.target.value);
                        setSelectedMicrophone(device || null);
                      }}
                      className="w-full p-2 border rounded-md bg-white/90"
                    >
                      {microphones.map(mic => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${mic.deviceId}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stream Keys Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-[#14263A]">Stream Keys</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white/90"
                    >
                      {Object.entries(PLATFORM_STATUS)
                        .filter(([_, status]) => status.available)
                        .map(([key, status]) => (
                          <option key={key} value={key}>
                            {status.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={currentStreamKey}
                        onChange={(e) => setCurrentStreamKey(e.target.value)}
                        placeholder="Enter stream key"
                        className="w-full p-2 border rounded-md bg-white/90"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAutoFetch}
                        className={`p-2 rounded-md transition-colors ${
                          isPlatformAttached(selectedPlatform)
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={
                          isPlatformAttached(selectedPlatform)
                            ? "Fetch automatically"
                            : "Please attach Account in Settings"
                        }
                        disabled={!isPlatformAttached(selectedPlatform)}
                      >
                        <RefreshCwIcon className="w-5 h-5"/>
                      </button>
                      <button
                        onClick={handleStreamKeyUpdate}
                        className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        title="Save stream key"
                      >
                        <SaveIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Platform Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <AlertCircle className="w-6 h-6 text-blue-500"/>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {PLATFORM_STATUS[selectedUnavailablePlatform].name} Not Available
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {/*// ... [Previous code remains exactly the same until the modal content]*/}

              {PLATFORM_STATUS[selectedUnavailablePlatform]?.message ||
                'This platform is currently not available. We are working on adding support for it.'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Platform Button Component
const PlatformButton: React.FC<PlatformButtonProps> = ({platform, active, disabled, onClick}) => {
  const Icon = PLATFORM_STATUS[platform].icon;
  const isAvailable = PLATFORM_STATUS[platform].available;

  return (
    <div className="flex items-center justify-center gap-1 flex-col">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`transition-transform hover:scale-110 focus:outline-none
          ${disabled ? 'opacity-50' : ''}
          ${!isAvailable ? 'opacity-40' : ''}`}
      >
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-[#14263A] hover:opacity-80"/>
      </button>
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}/>
    </div>
  );
};

export default LivegateNow;
