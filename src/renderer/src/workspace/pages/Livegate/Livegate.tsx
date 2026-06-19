import React, { useEffect, useRef, useState, useCallback } from 'react';
import { YoutubeIcon, InstagramIcon, TwitterIcon, TwitchIcon, Loader2Icon } from "lucide-react";
import { toast } from '@renderer/hooks/use-toast';
import logo from '@renderer/assets/logo.svg';
import LiveChat from './components/LiveChat';

// Constants
const CHUNK_SIZE = 16384;  // 16KB chunk size
const MAX_BUFFER_SIZE = 1048576; // 1MB max buffer
const HEALTH_CHECK_INTERVAL = 5000;  // 5 seconds



// Types
interface StreamHealth {
  buffering: boolean;
  bandwidth: number;
  dropped: number;
  latency: number;
}

interface StreamBuffer {
  chunks: Uint8Array[];
  size: number;
}

interface StreamKeys {
  youtube?: string;
  instagram?: string;
  twitter?: string;
  twitch?: string;
}

interface LiveStatus {
  youtube: boolean;
  instagram: boolean;
  twitter: boolean;
  twitch: boolean;
}

// Custom hooks
const useStreamBuffer = () => {
  const bufferRef = useRef<StreamBuffer>({ chunks: [], size: 0 });

  const resetBuffer = useCallback(() => {
    bufferRef.current = { chunks: [], size: 0 };
  }, []);

  const addToBuffer = useCallback((chunk: Uint8Array): Uint8Array | null => {
    const { chunks, size } = bufferRef.current;

    if (size + chunk.length > MAX_BUFFER_SIZE) {
      console.warn('Buffer overflow, dropping oldest chunks');
      while (bufferRef.current.size + chunk.length > MAX_BUFFER_SIZE) {
        const oldestChunk = chunks.shift();
        if (oldestChunk) {
          bufferRef.current.size -= oldestChunk.length;
        }
      }
    }

    chunks.push(chunk);
    bufferRef.current.size += chunk.length;

    if (bufferRef.current.size >= CHUNK_SIZE) {
      const combined = new Uint8Array(bufferRef.current.size);
      let offset = 0;
      chunks.forEach(chunk => {
        combined.set(chunk, offset);
        offset += chunk.length;
      });
      resetBuffer();
      return combined;
    }

    return null;
  }, [resetBuffer]);

  return { bufferRef, addToBuffer, resetBuffer };
};

const useStreamHealth = (isLive: boolean) => {
  const [health, setHealth] = useState<StreamHealth>({
    buffering: false,
    bandwidth: 0,
    dropped: 0,
    latency: 0
  });

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setHealth(prev => ({
          ...prev,
          buffering: true,
          latency: prev.latency + 1
        }));
      }
    }, HEALTH_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isLive]);

  const updateHealth = useCallback((updates: Partial<StreamHealth>) => {
    setHealth(prev => ({ ...prev, ...updates }));
  }, []);

  return { health, updateHealth };
};

// Main Component
const LivegateNow = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { addToBuffer, resetBuffer } = useStreamBuffer();

  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeClass, setActiveClass] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPlatform, _setCurrentPlatform] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [streamKeys, setStreamKeys] = useState<StreamKeys>({});
  
  const selectedInstance = localStorage.getItem("selectedInstanceId");
  const [selectedInstanceAccounts, setSelectedInstanceAccounts] = useState<string[]>([]);

  const [liveStatus, setLiveStatus] = useState<LiveStatus>({
    youtube: false,
    instagram: false,
    twitter: false,
    twitch: false
  });

  const { health, updateHealth } = useStreamHealth(isLive);

  // Media Stream Setup
  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        streamRef.current = stream;
      } catch (error) {
        console.error('Camera initialization error:', error);
        toast({
          title: 'Camera Error',
          description: 'Unable to access camera or microphone',
          variant: 'destructive'
        });
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Account and Stream Key Management
  useEffect(() => {
    const handleAttachedAccounts = (_event: unknown, accounts: Record<string, string[]>[]) => {
      const instanceAccounts = accounts.find((account) => Object.keys(account)[0] === selectedInstance);
      setSelectedInstanceAccounts(instanceAccounts?.[selectedInstance ?? ''] || []);
    };

    const handleStreamKeys = (_event: unknown, keys: Record<string, StreamKeys>[]) => {
      if (keys.length === 0) {
        setStreamKeys({
          youtube: '',
          twitch: '',
          instagram: '',
          twitter: ''
        });
        return;
      }
      const instanceKeys = keys.find((key) => Object.keys(key)[0] === selectedInstance);
      setStreamKeys(instanceKeys?.[selectedInstance ?? ''] ?? {});
    };

    window.electron.ipcRenderer.send('show-attached-accounts');
    window.electron.ipcRenderer.send('show-stream-keys');

    window.electron.ipcRenderer.on('attached-accounts', handleAttachedAccounts);
    window.electron.ipcRenderer.on('stream-keys', handleStreamKeys);
    window.electron.ipcRenderer.on('stream-keys-updated', () => {
      window.electron.ipcRenderer.send('show-stream-keys');
    });

    return () => {
      window.electron.ipcRenderer.removeListener('attached-accounts', handleAttachedAccounts);
      window.electron.ipcRenderer.removeListener('stream-keys', handleStreamKeys);
    };
  }, [selectedInstance]);

  // Stream Status Management
  useEffect(() => {
    const handleStreamStatus = (status) => {

      if (status.status === 'error') {
        toast({
          title: `Stream Error - ${status.platform}`,
          description: status.message,
          variant: 'destructive'
        });

        setLiveStatus(prev => ({
          ...prev,
          [status.platform]: false
        }));

        updateHealth({
          dropped: health.dropped + 1,
          buffering: true
        });
      } else if (status.status === 'started') {
        setLiveStatus(prev => ({
          ...prev,
          [status.platform]: true
        }));
        updateHealth({
          buffering: false,
          latency: 0
        });
      } else if (status.status === 'stopped') {
        setLiveStatus(prev => ({
          ...prev,
          [status.platform]: false
        }));
      }
    };

    window.electron.ipcRenderer.on('streaming-status', handleStreamStatus);

    return () => {
      window.electron.ipcRenderer.removeListener('streaming-status', handleStreamStatus);
    };
  }, [health.dropped, updateHealth]);

  // Stream Recording Management
  useEffect(() => {
    if (!isLive || !streamRef.current) return;

    try {
      const options = {
        mimeType: 'video/webm;codecs=h264',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      };

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          const chunk = new Uint8Array(buffer);
          const processedChunk = addToBuffer(chunk);

          if (processedChunk) {
            Object.entries(liveStatus).forEach(([platform, isActive]) => {
              if (isActive as boolean) {
                window.electron.ipcRenderer.invoke('stream-data', {
                  data: Array.from(processedChunk),
                  platform,
                  timestamp: Date.now()
                }).catch(error => {
                  console.error(`Error sending stream data to ${platform}:`, error);
                  updateHealth({
                    dropped: health.dropped + 1,
                    buffering: true
                  });
                });
              }
            });
          }
        }
      };

      mediaRecorderRef.current.start(1000 / 30);

      return () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        resetBuffer();
      };
    } catch (error) {
      console.error('Stream recording error:', error);
      toast({
        title: 'Stream Recording Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      handleStopLive();
      return undefined
    }
  }, [isLive, liveStatus, addToBuffer, resetBuffer, health.dropped, updateHealth])

  // RTMP URL Generation
  const getRtmpUrl = useCallback((platform: string, key: string) => {
    const urls = {
      twitter: `rtmp://in.pscp.tv:80/x//${key}`,
      instagram: `rtmps://edgetee-upload-hbe1-2.xx.fbcdn.net:443/rtmp/${key}`,
      twitch: `rtmp://live-jfk.twitch.tv/app/${key}`,
      youtube: `rtmp://a.rtmp.youtube.com/live2/${key}`
    };
    return urls[platform.toLowerCase()];
  }, []);

  // Stream Control Functions
  const handleGoLive = useCallback(async () => {
    setLoading(true);
    resetBuffer();

    try {
      const platformsToStream = Object.entries(streamKeys)
        .filter(([platform, key]) => key?.trim() !== '' && liveStatus[platform])
        .map(([platform, key]) => ({
          platform,
          rtmpUrl: getRtmpUrl(platform, key)
        }));

      if (platformsToStream.length === 0) {
        toast({
          title: 'No Platforms Selected',
          description: 'Please select and configure at least one platform',
          variant: 'destructive'
        });
        return;
      }

      await Promise.all(
        platformsToStream.map(({platform, rtmpUrl}) =>
          window.electron.ipcRenderer.invoke('start-streaming', {
            rtmpUrl,
            streamType: 'video/webm',
            platform
          })
        )
      );

      setIsLive(true);
      setActiveClass(true);
      updateHealth({
        buffering: false,
        latency: 0,
        dropped: 0
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Stream Start Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [streamKeys, liveStatus, getRtmpUrl, resetBuffer, updateHealth]);

  const handleStopLive = useCallback(async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      await window.electron.ipcRenderer.invoke('stop-streaming', {});

      setIsLive(false);
      setActiveClass(false);
      setLiveStatus({
        youtube: false,
        instagram: false,
        twitter: false,
        twitch: false
      });

      resetBuffer();
      updateHealth({
        buffering: false,
        bandwidth: 0,
        dropped: 0,
        latency: 0
      });
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast({
        title: 'Stream Stop Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [resetBuffer, updateHealth]);

  const handleIconClick = useCallback((platform: string) => {
    if (isLive) return;

    if (streamKeys?.[platform]) {
      setLiveStatus(prev => ({
        ...prev,
        [platform]: !prev[platform]
      }));
      return;
    }

    if (!selectedInstanceAccounts.includes(platform.toLowerCase())) {
      toast({
        title: 'Account Not Attached',
        description: `Please attach your ${platform} account to this instance`,
        variant: 'destructive'
      });
      return;
    }

    window.electron.ipcRenderer.send('add-stream-key', selectedInstance, platform.toLowerCase());
  }, [isLive, streamKeys, selectedInstance, selectedInstanceAccounts]);

  // UI Event Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamKey(e.target.value);
  };

  const handleStreamKeySubmit = () => {
    setStreamKeys(prev => ({
      ...prev,
      [currentPlatform]: streamKey
    }));
    setLiveStatus(prev => ({
      ...prev,
      [currentPlatform]: true
    }));
    setIsOpen(false);
    setStreamKey('');
  };

  return (
    <div className="relative w-full h-full bg-gray-100 z-[1]">
      <video
        ref={videoRef}
        className="absolute top-0 right-0 left-0 w-full h-full object-cover z-[2]"
        muted
        playsInline
      />
      <div className='p-8 flex items-center justify-center w-full h-full z-10 relative'>
        <div className='border-2 border-white w-full h-full z-20 relative'>
          <div className={`flex ${activeClass ? 'justify-start' : 'justify-center'} items-end w-full h-full`}>
            {activeClass && <LiveChat/>}
            <div
              className={`${activeClass ? 'xl:ml-[16%] lg:ml-[6%] ml-[3%]' : ''} w-80 bg-white/70 backdrop-blur-sm px-4 py-2 z-10 rounded-ss-xl rounded-se-xl border border-white`}>
              <div className="flex gap-6 items-center">
                <div className='flex items-center justify-center gap-1 flex-col'>
                  <button
                    onClick={() => handleIconClick('youtube')}
                    disabled={isLive}
                    className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  >
                    <YoutubeIcon className="w-8 h-8 text-[#14263A] hover:opacity-80"/>
                  </button>
                  <span className={`w-2 h-2 rounded-full ${liveStatus.youtube ? 'bg-green-500' : 'bg-red-500'}`}/>
                </div>

                <div className='flex items-center justify-center gap-1 flex-col'>
                  <button
                    onClick={() => handleIconClick('instagram')}
                    disabled={isLive}
                    className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  >
                    <InstagramIcon className="w-8 h-8 text-[#14263A] hover:opacity-80"/>
                  </button>
                  <span className={`w-2 h-2 rounded-full ${liveStatus.instagram ? 'bg-green-500' : 'bg-red-500'}`}/>
                </div>

                <button
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

                <div className='flex items-center justify-center gap-1 flex-col'>
                  <button
                    onClick={() => handleIconClick('twitter')}
                    disabled={isLive}
                    className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  >
                    <TwitterIcon className="w-8 h-8 text-[#14263A] hover:opacity-80"/>
                  </button>
                  <span className={`w-2 h-2 rounded-full ${liveStatus.twitter ? 'bg-green-500' : 'bg-red-500'}`}/>
                </div>

                <div className='flex items-center justify-center gap-1 flex-col'>
                  <button
                    onClick={() => handleIconClick('twitch')}
                    disabled={isLive}
                    className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  >
                    <TwitchIcon className="w-8 h-8 text-[#14263A] hover:opacity-80"/>
                  </button>
                  <span className={`w-2 h-2 rounded-full ${liveStatus.twitch ? 'bg-green-500' : 'bg-red-500'}`}/>
                </div>
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

      {/* Stream key modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-md xl:w-96 w-80">
            <h2 className="text-lg font-bold text-[#14263A] capitalize">{currentPlatform} Stream Key</h2>
            <input
              type="text"
              value={streamKey}
              onChange={handleInputChange}
              placeholder={`Enter ${currentPlatform} Stream Key`}
              className="border outline-[#14263A] p-2 w-full mt-4 rounded-md"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setStreamKey('');
                }}
                className="mr-4 bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStreamKeySubmit}
                className="bg-[#14263A] text-white px-4 py-2 rounded-md hover:bg-[#14263A]/80 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivegateNow;
