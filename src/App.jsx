import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode'; 
import { QRCodeSVG } from 'qrcode.react'; 

export default function App() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing Zetcam...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);

  const stopMediaTracks = () => {
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      const tracks = myVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      myVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (mode === 'home') {
      stopMediaTracks(); 
      
      if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
      if (scannerInstanceRef.current) {
        try { 
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().then(() => {
              scannerInstanceRef.current.clear();
            }).catch(() => {});
          } else {
            scannerInstanceRef.current.clear();
          }
        } catch (e) {}
        scannerInstanceRef.current = null;
      }
      setIsConnected(false);
      setPeerId('');
      setRemoteId('');
      return;
    }

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('Zetcam Engine Active');
    });

    peer.on('error', (err) => {
      setStatus("Engine Error: " + err.type);
    });

    peer.on('call', (call) => {
      setStatus('Incoming feed detected...');
      call.answer();
      call.on('stream', (remoteStream) => {
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
        const readerElement = document.getElementById('reader');
        if (!readerElement || scannerInstanceRef.current) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerInstanceRef.current = html5QrCode;
        setStatus("Requesting camera permissions...");

        Html5Qrcode.getCameras().then(devices => {
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
                  scannerInstanceRef.current = null;
                  handleConnectToPC(decodedText);
                }).catch(() => {
                  scannerInstanceRef.current = null;
                  handleConnectToPC(decodedText);
                });
              },
              () => {} 
            ).then(() => {
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
      if (peer) peer.destroy();
      if (scannerInstanceRef.current) {
        try { 
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(()=>{}); 
          }
        } catch(e) {}
      }
    };
  }, [mode]);

  const handleConnectToPC = async (targetPcId) => {
    setStatus('Accessing camera hardware...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false, facingMode: 'environment' });
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      peerInstance.current.call(targetPcId, stream);
      setIsConnected(true);
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: ' + err.message);
    }
  };

  const executeManualConnect = () => {
    if (!remoteId.trim()) {
      setStatus("Please enter a valid PC ID.");
      return;
    }
    
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      scannerInstanceRef.current.stop().then(() => {
        handleConnectToPC(remoteId.trim());
      }).catch(() => handleConnectToPC(remoteId.trim()));
    } else {
      handleConnectToPC(remoteId.trim());
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#120d1a] text-white font-sans antialiased p-4 md:p-6 flex flex-col items-center justify-start overflow-x-hidden selection:bg-pink-500/30">
      
      <style>{`
        html, body, #root {
          background-color: #120d1a !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 1rem !important;
          width: 100% !important;
        }
      `}</style>
      
      <header className="w-full max-w-4xl flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            ZETCAM PRO <span className="text-[10px] font-normal text-white/30">v2.0</span>
          </h1>
        </div>
        {mode !== 'home' && (
          <button 
            onClick={() => setMode('home')}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </header>

      {mode === 'home' && (
        <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-6 justify-center items-stretch my-auto py-10">
          <button 
            onClick={() => setMode('camera')}
            className="flex-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-left transition-all hover:border-pink-500/40 hover:bg-pink-500/[0.01] group relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-105 transition-transform">
              <Camera size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">I am the Camera</h3>
            <p className="text-sm text-white/40 leading-relaxed">Turn this phone into a streaming lens. Opens the automatic QR scanner.</p>
            <div className="absolute -bottom-4 -right-4 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors">
              <Radio size={90} />
            </div>
          </button>

          <button 
            onClick={() => setMode('receiver')}
            className={
              "flex-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-left " +
              "transition-all hover:border-purple-500/40 hover:bg-purple-500/[0.01] group relative overflow-hidden"
            }
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-105 transition-transform">
              <Monitor size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">I am the PC Monitor</h3>
            <p className="text-sm text-white/40 leading-relaxed">Host the stream display window. Generates the secure target QR matrix.</p>
            <div className="absolute -bottom-4 -right-4 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors">
              <CheckCircle size={90} />
            </div>
          </button>
        </div>
      )}

      {mode === 'camera' && (
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
            <span className="text-[13px] font-medium text-pink-400 flex items-center justify-center gap-2">
              <Radio size={14} className="animate-pulse" /> {status}
            </span>
          </div>

          <div className={`w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-center flex flex-col gap-3 ${isConnected ? 'hidden' : 'block'}`}>
            <h4 className="text-md font-bold">Align Scanner to PC Screen</h4>
            
            <div id="reader" className="overflow-hidden rounded-xl