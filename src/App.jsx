import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { 
  Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, 
  Settings, SwitchCamera, Zap, ZapOff, RotateCw, XOctagon 
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react'; 

export default function App() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing Zetcam...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // Forces Back Camera by default
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [activeStream, setActiveStream] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);

  const resetSystem = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
      setActiveStream(null);
    }
    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }
    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }
    if (scannerInstanceRef.current) {
      try { scannerInstanceRef.current.clear(); } catch (e) {}
      scannerInstanceRef.current = null;
    }
    setIsConnected(false);
    setIsFlashOn(false);
    setRotation(0);
    setPeerId('');
  };

  useEffect(() => {
    if (mode === 'home') {
      resetSystem();
      return;
    }

    const localId = Math.floor(100000 + Math.random() * 900000).toString();
    const peer = new Peer(localId, {
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

    peer.on('call', (call) => {
      setStatus('Incoming feed detected...');
      call.answer();
      setCurrentCall(call);
      call.on('stream', (remoteStream) => {
        setIsConnected(true);
        setStatus('Streaming Live to PC!');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
      call.on('close', () => {
        resetSystem();
        setMode('home');
      });
    });

    peerInstance.current = peer;

    if (mode === 'camera') {
      setTimeout(() => {
        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        try {
          // Setting up scanner to heavily prefer environment (back) camera
          const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 230, height: 230 },
            rememberLastUsedCamera: true,
            videoConstraints: { facingMode: "environment" } 
          }, false);

          let isScanProcessed = false; // Lock variable to prevent duplicate scan crashes

          scanner.render(
            (decodedText) => {
              // 1. If we already scanned, ignore any extra frames
              if (isScanProcessed) return; 
              isScanProcessed = true;
              setStatus('Target locked! Releasing scanner...');

              // 2. Shut down the scanner cleanly
              scanner.clear().then(() => {
                scannerInstanceRef.current = null;
                
                // 3. THE FIX: Wait 800ms for Android hardware to physically release the camera lens
                setTimeout(() => {
                  handleConnectToPC(decodedText);
                }, 800);

              }).catch(() => {
                // Fallback timeout in case clear() throws a silent error
                setTimeout(() => {
                  handleConnectToPC(decodedText);
                }, 800);
              });
            },
            () => {} // Suppress continuous scanning warnings
          );
          
          scannerInstanceRef.current = scanner;
        } catch (err) {
          setStatus("Scanner error");
        }
      }, 400); 
    }

    return () => resetSystem();
  }, [mode]);

  const handleConnectToPC = async (targetPcId) => {
    setStatus('Mounting Live Stream...');
    try {
      // Strictly request the facingMode state (defaults to 'environment' / back camera)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }, 
        audio: false 
      });
      
      setActiveStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      const call = peerInstance.current.call(targetPcId, stream);
      setCurrentCall(call);
      
      setIsConnected(true);
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Hardware Error: ' + err.message);
      // Helpful fallback alert for Android debugging
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert("Android camera lock detected. Please refresh the page and try again.");
      }
    }
  };

  const toggleCamera = async () => {
    if (!activeStream) return;
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    setShowSettings(false);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (currentCall && currentCall.peerConnection) {
        const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }

      if (myVideoRef.current) myVideoRef.current.srcObject = newStream;
      
      activeStream.getTracks().forEach(t => t.stop());
      setActiveStream(newStream);
      setIsFlashOn(false); 
    } catch (err) {
      console.error("Camera switch failed", err);
    }
  };

  const toggleFlash = async () => {
    if (!activeStream) return;
    const track = activeStream.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        const newFlashState = !isFlashOn;
        await track.applyConstraints({ advanced: [{ torch: newFlashState }] });
        setIsFlashOn(newFlashState);
      } else {
        alert("Flashlight is not supported on this specific camera lens.");
      }
    } catch (err) {
      console.error("Flash error", err);
    }
    setShowSettings(false);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setShowSettings(false);
  };

  const handleDisconnect = () => {
    resetSystem();
    setMode('home');
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#120d1a] text-white font-sans antialiased p-4 md:p-6 flex flex-col items-center justify-start overflow-x-hidden selection:bg-pink-500/30">
      
      <style>{`
        html, body, #root {
          background-color: #120d1a !important; margin: 0; padding: 0; width: 100%; overflow-x: hidden; max-width: 100%;
        }
        #reader __video { border-radius: 1rem; }
      `}</style>
      
      {/* HEADER WITH DYNAMIC SPACING */}
      <header className={`w-full max-w-4xl flex justify-between items-center relative z-50 transition-all ${mode === 'receiver' && isConnected ? 'mb-0 mt-2' : 'mb-6 border-b border-white/5 pb-4'}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
            ZETCAM PRO <span className="text-[10px] font-normal text-white/30 tracking-normal mt-1">v2.0</span>
          </h1>
        </div>

        {/* RIGHT ALIGNED CONTROLS */}
        <div className="flex items-center gap-3">
          {mode !== 'home' && (
            <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all shadow-lg backdrop-blur-sm">
              <ArrowLeft size={14} /> Home
            </button>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 text-white/70 hover:text-white shadow-lg backdrop-blur-sm"
            >
              <Settings size={18} className={showSettings ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>

            {showSettings && (
              <div className="absolute top-12 right-0 w-48 bg-[#1a1226] border border-white/10 shadow-2xl rounded-xl p-2 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95">
                
                {mode === 'camera' && isConnected && (
                  <>
                    <button onClick={toggleCamera} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 rounded-lg text-left transition-colors">
                      <SwitchCamera size={16} className="text-pink-400" /> Switch Camera
                    </button>
                    <button onClick={toggleFlash} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 rounded-lg text-left transition-colors">
                      {isFlashOn ? <ZapOff size={16} className="text-yellow-400" /> : <Zap size={16} className="text-yellow-400" />} 
                      {isFlashOn ? 'Flash Off' : 'Flash On'}
                    </button>
                  </>
                )}
                
                {(mode === 'camera' || mode === 'receiver') && isConnected && (
                  <button onClick={handleRotate} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 rounded-lg text-left transition-colors">
                    <RotateCw size={16} className="text-blue-400" /> Rotate Feed
                  </button>
                )}

                {(mode !== 'home') && (
                  <button onClick={handleDisconnect} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-red-500/10 text-red-400 rounded-lg text-left transition-colors mt-1 border-t border-white/5">
                    <XOctagon size={16} /> Disconnect
                  </button>
                )}

                {mode === 'home' && (
                  <div className="px-3 py-2 text-xs text-white/30 text-center italic">Connect to a device to unlock tools</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. HOME SCREEN */}
      {mode === 'home' && (
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 justify-center items-stretch my-auto py-6">
          <button onClick={() => setMode('camera')} className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left transition-all hover:border-pink-500/40 hover:bg-pink-500/[0.01] group relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-105 transition-transform"><Camera size={24} /></div>
            <h3 className="text-lg font-bold mb-1">I am the Camera</h3>
            <p className="text-xs text-white/40 leading-relaxed">Turn this phone into a streaming lens. Opens the automatic QR scanner.</p>
            <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors"><Radio size={70} /></div>
          </button>
          <button onClick={() => setMode('receiver')} className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/[0.01] group relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform"><Monitor size={24} /></div>
            <h3 className="text-lg font-bold mb-1">I am the PC Monitor</h3>
            <p className="text-xs text-white/40 leading-relaxed">Host the stream display window. Generates the secure target QR matrix.</p>
            <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors"><CheckCircle size={70} /></div>
          </button>
        </div>
      )}

      {/* 2. CAMERA VIEW */}
      {mode === 'camera' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
            <span className="text-[13px] font-medium text-pink-400 flex items-center justify-center gap-2">
              <Radio size={14} className={isConnected ? "animate-pulse text-emerald-400" : "animate-pulse"} /> {status}
            </span>
          </div>

          {!isConnected ? (
            <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-center flex flex-col gap-3">
              <h4 className="text-md font-bold">Align Scanner to PC Screen</h4>
              <div id="reader" className="overflow-hidden rounded-xl bg-black border border-white/5 text-black max-w-full"></div>
              <div className="text-xs text-white/30 my-1">— OR USE MANUAL BACKUP —</div>
              <div className="flex gap-2 w-full">
                <input type="text" placeholder="Enter 6-Digit PC Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"/>
                <button onClick={() => handleConnectToPC(remoteId)} className="bg-pink-500 text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-pink-400 active:scale-95 transition-all">Connect</button>
              </div>
            </div>
          ) : (
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative aspect-[3/4] flex items-center justify-center">
              <video 
                ref={myVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }} 
              />
              <div className="absolute bottom-4 flex justify-center w-full gap-4">
                <button onClick={toggleCamera} className="bg-black/50 backdrop-blur-md border border-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all"><SwitchCamera size={20}/></button>
                <button onClick={toggleFlash} className={`backdrop-blur-md border border-white/10 text-white p-3 rounded-full transition-all ${isFlashOn ? 'bg-yellow-500/50' : 'bg-black/50 hover:bg-white/20'}`}><Zap size={20}/></button>
                <button onClick={handleDisconnect} className="bg-red-500/80 backdrop-blur-md border border-white/10 text-white p-3 rounded-full hover:bg-red-500 transition-all"><XOctagon size={20}/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. RECEIVER VIEW */}
      {mode === 'receiver' && (
        <div className={isConnected ? "fixed inset-0 w-full h-full bg-black z-0 flex items-center justify-center" : "w-full max-w-4xl flex flex-col lg:flex-row items-center gap-6"}>
          
          {!isConnected && (
            <div className="w-full max-w-xs bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center flex flex-col items-center z-10">
              <h3 className="text-md font-bold mb-1">Scan to Pair Device</h3>
              <p className="text-[11px] text-white/40 mb-4">Point your mobile scanner at this code</p>
              <div className="bg-white p-3 rounded-xl mb-4 flex justify-center items-center min-h-[160px] min-w-[160px]">
                {peerId ? <QRCodeSVG value={peerId} size={150} /> : <div className="flex flex-col items-center gap-1 text-black/40"><RefreshCw className="animate-spin text-purple-600" size={20}/><span className="text-[10px]">Generating Key...</span></div>}
              </div>
              <div className="w-full bg-black/40 rounded-lg p-2 border border-white/5 overflow-hidden">
                <span className="text-[9px] text-white/30 block uppercase tracking-wider mb-0.5">Manual Entry Code</span>
                <code className="text-xl tracking-widest font-black text-purple-400 block">{peerId || '...'}</code>
              </div>
            </div>
          )}

          <div className={isConnected ? "w-full h-full" : "flex-1 bg-black rounded-2xl border border-white/10 relative overflow-hidden min-h-[380px] w-full flex items-center justify-center z-10"}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-contain transition-transform duration-300 ${isConnected ? '' : 'max-h-[75vh]'}`}
              style={{ transform: `rotate(${rotation}deg)` }} 
            />
            {!isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-2 text-center p-4">
                <Radio size={24} className="text-white/30 animate-pulse" />
                <h4 className="text-sm font-bold">Awaiting Stream Connection</h4>
                <p className="text-[11px] text-white/40 max-w-xs leading-relaxed">Video input frames will mount here as soon as the phone reads the authentication matrix.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}