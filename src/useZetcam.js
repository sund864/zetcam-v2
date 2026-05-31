import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Html5Qrcode } from 'html5-qrcode'; 
import { Capacitor, registerPlugin } from '@capacitor/core'; 

// Initialize our Custom Native Bridge
const ZetPiP = registerPlugin('ZetPiP');

const VIDEO_RESOLUTIONS = {
  '720p': { width: { ideal: 1280 }, height: { ideal: 720 } },
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
  '1440p': { width: { ideal: 2560 }, height: { ideal: 1440 } },
  '4K': { width: { ideal: 3840 }, height: { ideal: 2160 } }
};

export function useZetcam() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing Engine...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  const [isTorchOn, _setIsTorchOn] = useState(false);
  const isTorchOnRef = useRef(false);
  const setIsTorchOn = (val) => { isTorchOnRef.current = val; _setIsTorchOn(val); };

  const [facingMode, setFacingMode] = useState('environment'); 
  const [videoQuality, setVideoQuality] = useState('1080p'); 

  const [exposureLevel, _setExposureLevel] = useState(50);
  const exposureLevelRef = useRef(50);
  const setExposureLevel = (val) => { exposureLevelRef.current = val; _setExposureLevel(val); };

  const [remoteTorch, setRemoteTorch] = useState(false);
  const [remoteExposure, setRemoteExposure] = useState(50);

  const [stayAwake, setStayAwake] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);

  const isNativeApp = Capacitor.isNativePlatform();

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);
  const currentCallRef = useRef(null); 
  const dataConnRef = useRef(null); 
  const wakeLockRef = useRef(null); 
  
  const isDisconnectingRef = useRef(false); 

  // Sync React connection state with the Android Java layer
  useEffect(() => {
    if (isNativeApp) {
      ZetPiP.setStreamState({ isActive: isConnected }).catch(() => {});
    }
  }, [isConnected, isNativeApp]);

  const handleGoHome = async () => {
    if (isDisconnectingRef.current) return;
    isDisconnectingRef.current = true;
    setStatus('Safely powering down camera...');

    if (document.pictureInPictureElement) {
      try { await document.exitPictureInPicture(); } catch(e) {}
    }

    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({ type: 'CMD_DISCONNECT' });
    }

    if (myVideoRef.current && myVideoRef.current.srcObject) {
      myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      myVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }

    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (e) {}
      scannerInstanceRef.current = null;
    }

    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }

    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }

    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch (e) {}
      wakeLockRef.current = null;
    }

    currentCallRef.current = null;
    setIsConnected(false);
    setPeerId('');
    setRemoteId('');
    setIsTorchOn(false); 
    setFacingMode('environment'); 
    setVideoQuality('1080p');
    setExposureLevel(50); 
    setRemoteTorch(false);
    setRemoteExposure(50);
    
    setStayAwake(false);
    setBatterySaver(false);
    
    setMode('home');
    setTimeout(() => { isDisconnectingRef.current = false; }, 500);
  };

  const broadcastState = (torch, exp) => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({ type: 'STATE', torch, exposure: exp });
    }
  };

  const sendRemoteCommand = (action, value) => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({ type: action, value });
    }
  };

  const toggleTorch = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const track = myVideoRef.current.srcObject.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (!capabilities.torch) return;
      const newState = !isTorchOnRef.current;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setIsTorchOn(newState);
      broadcastState(newState, exposureLevelRef.current);
    } catch (err) {}
  };

  const toggleLens = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    setStatus('Switching lenses...');
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    try {
      myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      await new Promise(resolve => setTimeout(resolve, 300));
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: newMode, ...VIDEO_RESOLUTIONS[videoQuality] }, 
        audio: false 
      });
      myVideoRef.current.srcObject = newStream;
      setFacingMode(newMode);
      setIsTorchOn(false); 
      setExposureLevel(50);
      broadcastState(false, 50);
      
      if (currentCallRef.current && currentCallRef.current.peerConnection) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = currentCallRef.current.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: Could not switch lens.');
    }
  };

  const changeQuality = async (newQuality) => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    setStatus(`Switching resolution to ${newQuality}...`);
    try {
      myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      await new Promise(resolve => setTimeout(resolve, 300));
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode, ...VIDEO_RESOLUTIONS[newQuality] }, 
        audio: false 
      });
      myVideoRef.current.srcObject = newStream;
      setVideoQuality(newQuality);
      setIsTorchOn(false); 
      setExposureLevel(50);
      broadcastState(false, 50);

      if (currentCallRef.current && currentCallRef.current.peerConnection) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = currentCallRef.current.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: Resolution not supported.');
    }
  };

  const adjustExposure = async (sliderValue) => {
    const val = parseInt(sliderValue, 10);
    setExposureLevel(val);
    broadcastState(isTorchOnRef.current, val); 
    
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const track = myVideoRef.current.srcObject.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.exposureCompensation) {
        const min = capabilities.exposureCompensation.min || -3;
        const max = capabilities.exposureCompensation.max || 3;
        const hwValue = min + ((val / 100) * (max - min));
        await track.applyConstraints({ advanced: [{ exposureCompensation: hwValue }] });
      }
    } catch (err) {}
  };

  const togglePiP = async () => {
    if (isNativeApp) {
      try {
        await ZetPiP.enterPiP();
      } catch (err) {
        setStatus('System Error: Native PiP activation failed.');
      }
    } else {
      // Desktop Browser Fallback
      const activeVideo = mode === 'camera' ? myVideoRef.current : remoteVideoRef.current;
      if (activeVideo && document.pictureInPictureEnabled) {
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await activeVideo.requestPictureInPicture();
        } catch (err) {}
      }
    }
  };

  const toggleStayAwake = async () => {
    if (!('wakeLock' in navigator)) {
      setStatus('Notice: Stay Awake not supported by your browser.');
      return;
    }
    try {
      if (!stayAwake) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setStayAwake(true);
      } else {
        if (wakeLockRef.current) await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setStayAwake(false);
      }
    } catch (err) {
      setStatus('System Error: Could not lock screen.');
    }
  };

  const toggleBatterySaver = async () => {
    const newState = !batterySaver;
    setBatterySaver(newState);
    if (newState && !stayAwake && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setStayAwake(true);
      } catch (e) {}
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (stayAwake && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (e) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stayAwake]);

  useEffect(() => {
    let isActive = true; 
    if (mode === 'home') return; 

    const custom6DigitPin = Math.floor(100000 + Math.random() * 900000).toString();

    const peer = new Peer(custom6DigitPin, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      if (!isActive) return;
      setPeerId(id);
      setStatus('Secure Connection Active');
    });

    peer.on('error', (err) => {
      if (!isActive) return;
      setStatus("Engine Error: " + err.type);
    });

    peer.on('call', (call) => {
      setStatus('Incoming feed detected...');
      currentCallRef.current = call; 
      call.answer();
      
      call.on('stream', (remoteStream) => {
        if (!isActive) return;
        setIsConnected(true);
        setStatus('Streaming Live to PC!');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      call.on('close', () => {
        if (!isDisconnectingRef.current) handleGoHome();
      });
    });

    peer.on('connection', (conn) => {
      dataConnRef.current = conn;
      conn.on('data', (data) => {
        if (data.type === 'STATE') {
          setRemoteTorch(data.torch);
          setRemoteExposure(data.exposure);
        }
        if (data.type === 'CMD_DISCONNECT') {
          handleGoHome();
        }
      });
      
      conn.on('close', () => {
        if (!isDisconnectingRef.current) handleGoHome();
      });
    });

    peerInstance.current = peer;

    if (mode === 'camera') {
      setTimeout(() => {
        if (!isActive) return;
        const readerElement = document.getElementById('reader');
        if (!readerElement || scannerInstanceRef.current) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerInstanceRef.current = html5QrCode;
        setStatus("Requesting camera permissions...");

        Html5Qrcode.getCameras().then(devices => {
          if (!isActive) return;
          if (devices && devices.length) {
            let selectedCameraId = devices[0].id; 
            for (let i = 0; i < devices.length; i++) {
              const camLabel = devices[i].label.toLowerCase();
              if (camLabel.includes('back') || camLabel.includes('rear') || camLabel.includes('environment')) {
                selectedCameraId = devices[i].id;
                break;
              }
            }

            html5QrCode.start(
              selectedCameraId,
              { fps: 10, qrbox: { width: 220, height: 220 } },
              (decodedText) => {
                html5QrCode.stop().then(() => {
                  scannerInstanceRef.current.clear();
                  scannerInstanceRef.current = null;
                  handleConnectToPC(decodedText);
                }).catch(() => {
                  scannerInstanceRef.current = null;
                  handleConnectToPC(decodedText);
                });
              },
              () => {} 
            ).then(() => {
              if (!isActive) {
                html5QrCode.stop().catch(()=>{});
                return;
              }
              setStatus("Scanner Active. Point at PC.");
            }).catch(() => {
              setStatus("Camera blocked. Check browser settings.");
            });
            
          } else {
            setStatus("No cameras detected on this device.");
          }
        }).catch(() => {
          setStatus("Permission Denied. Please allow camera access.");
        });

      }, 150); 
    }

    return () => {
      isActive = false; 
    };
  }, [mode]);

  const handleConnectToPC = async (targetPcId) => {
    setStatus('Accessing camera hardware...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('System Error: Browser blocked camera access. HTTPS required.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, ...VIDEO_RESOLUTIONS[videoQuality] }, audio: false });
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      const call = peerInstance.current.call(targetPcId, stream);
      currentCallRef.current = call; 
      
      call.on('close', () => {
        if (!isDisconnectingRef.current) handleGoHome();
      });
      
      const conn = peerInstance.current.connect(targetPcId);
      dataConnRef.current = conn;
      
      conn.on('open', () => {
        conn.send({ type: 'STATE', torch: isTorchOnRef.current, exposure: exposureLevelRef.current });
      });
      
      conn.on('data', (data) => {
        if (data.type === 'CMD_TORCH') toggleTorch();
        if (data.type === 'CMD_EXPOSURE') adjustExposure(data.value);
        if (data.type === 'CMD_DISCONNECT') handleGoHome();
      });

      conn.on('close', () => {
        if (!isDisconnectingRef.current) handleGoHome();
      });

      setIsConnected(true);
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: ' + err.message);
    }
  };

  const executeManualConnect = async () => {
    if (!remoteId.trim()) {
      setStatus("Please enter a valid PC ID.");
      return;
    }
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      try {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current.clear();
      } catch (e) {}
      scannerInstanceRef.current = null;
    }
    handleConnectToPC(remoteId.trim());
  };

  return {
    mode, setMode,
    peerId, status, isConnected,
    remoteId, setRemoteId,
    myVideoRef, remoteVideoRef,
    handleGoHome, executeManualConnect,
    isTorchOn, toggleTorch,
    facingMode, toggleLens,
    exposureLevel, adjustExposure,
    remoteTorch, remoteExposure, sendRemoteCommand,
    togglePiP,
    videoQuality, changeQuality,
    stayAwake, toggleStayAwake,
    batterySaver, toggleBatterySaver,
    isNativeApp
  };
}