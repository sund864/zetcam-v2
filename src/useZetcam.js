import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Html5Qrcode } from 'html5-qrcode'; 

export function useZetcam() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing Engine...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  // Hardware States
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [exposureLevel, setExposureLevel] = useState(50); // NEW: Default to middle exposure

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);
  const currentCallRef = useRef(null); 

  const handleGoHome = async () => {
    setStatus('Safely powering down camera...');

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

    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }

    currentCallRef.current = null;
    setIsConnected(false);
    setPeerId('');
    setRemoteId('');
    setIsTorchOn(false); 
    setFacingMode('environment'); 
    setExposureLevel(50); // Reset exposure on exit
    setMode('home');
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      const call = peerInstance.current.call(targetPcId, stream);
      currentCallRef.current = call; 
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

  const toggleTorch = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const track = myVideoRef.current.srcObject.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (!capabilities.torch) return;
      await track.applyConstraints({ advanced: [{ torch: !isTorchOn }] });
      setIsTorchOn(!isTorchOn);
    } catch (err) {}
  };

  const toggleLens = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    setStatus('Switching lenses...');
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    try {
      myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      await new Promise(resolve => setTimeout(resolve, 300));
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode }, audio: false });
      myVideoRef.current.srcObject = newStream;
      setFacingMode(newMode);
      setIsTorchOn(false); 
      setExposureLevel(50); // Reset exposure on lens switch to avoid blinding
      
      if (currentCallRef.current && currentCallRef.current.peerConnection) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = currentCallRef.current.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: Could not switch lens. ' + err.message);
    }
  };

  // NEW: Hardware Exposure Translation Math
  const adjustExposure = async (sliderValue) => {
    setExposureLevel(sliderValue);
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    
    const track = myVideoRef.current.srcObject.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.exposureCompensation) {
        // Find hardware limits (e.g. -3 to +3)
        const min = capabilities.exposureCompensation.min || -3;
        const max = capabilities.exposureCompensation.max || 3;
        // Translate 0-100 slider to hardware values
        const hwValue = min + ((sliderValue / 100) * (max - min));
        
        await track.applyConstraints({ 
          advanced: [{ exposureCompensation: hwValue }] 
        });
      }
    } catch (err) {
      // Silently catch errors so the UI slider doesn't freeze if a specific Android lens denies access
    }
  };

  return {
    mode, setMode,
    peerId, status, isConnected,
    remoteId, setRemoteId,
    myVideoRef, remoteVideoRef,
    handleGoHome, executeManualConnect,
    isTorchOn, toggleTorch,
    facingMode, toggleLens,
    exposureLevel, adjustExposure // NEW: Expose to UI
  };
}