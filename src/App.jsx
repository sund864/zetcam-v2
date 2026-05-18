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
  const [status, setStatus] = useState('Initializing...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
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
      setStatus('Engine Active');
    });

    peer.on('call', (call) => {
      setStatus('Incoming feed...');
      call.answer();
      setCurrentCall(call);
      call.on('stream', (remoteStream) => {
        setIsConnected(true);
        setStatus('Live!');
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
          const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 200, height: 200 }, // Slightly smaller to ensure fit
            rememberLastUsedCamera: true,
            videoConstraints: { facingMode: "environment" } 
          }, false);

          let isScanProcessed = false; 

          scanner.render(
            (decodedText) => {
              if (isScanProcessed) return; 
              isScanProcessed = true;
              setStatus('Target locked...');

              scanner.clear().then(() => {
                scannerInstanceRef.current = null;
                setTimeout(() => handleConnectToPC(decodedText), 800);
              }).catch(() => {
                setTimeout(() => handleConnectToPC(decodedText), 800);
              });
            },
            () => {} 
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
    setStatus('Mounting Stream...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }, 
        audio: false 
      });
      
      setActiveStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      const call = peerInstance.current.call(targetPcId, stream);
      setCurrentCall(call);
      
      setIsConnected(true);
      setStatus('Live!');
    } catch (err) {
      setStatus('Hardware Error');
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
    // STRICT VIEWPORT LOCK: h-[100dvh] and overflow-hidden ensures absolutely zero scrolling globally
    <div className="h-[100dvh] w-full bg-[#120d1a] text-white font-sans antialiased p-4 flex flex-col items-center justify-start overflow-hidden selection:bg-pink-500/30">
      
      <style>{`
        html, body, #root {
          background-color: #120d1a !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden !important; max-width: 100%;
        }
        #reader __video { border-radius: 1rem; }
      `}</style>
      
      {/* COMPACT HEADER */}
      <header className={`w-full max-w-4xl flex justify-between items-center relative z-50 transition-all ${mode === 'receiver' && isConnected ? 'mb-0 mt-2' : 'mb-4 border-b border-white/5 pb-3'}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
            ZETCAM PRO <span className="text-[9px] font-normal text-white/30 tracking-normal mt-1">v2.0</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {mode !== 'home' && (
            <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all shadow-lg backdrop-blur-sm">
              <ArrowLeft size={14} /> Home
            </button>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 text-white/70 hover:text-white shadow-lg backdrop-blur-sm"
            >
              <Settings size={18} className={showSettings ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>

            {showSettings && (
              <div className="absolute top-10 right-0 w-48 bg-[#1a1226] border border-white/10 shadow-2xl rounded-xl p-2 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95 z-50">
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

      {/* CORE CONTENT WRAPPER: Flex-1 ensures it uses exact remaining space */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center relative min-h-0">

        {/* 1. HOME SCREEN */}
        {mode === 'home' && (
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-center items-stretch px-2">
            <button onClick={() => setMode('camera')} className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-left transition-all hover:border-pink-500/40 hover:bg-pink-500/[0.01] group relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-105 transition-transform"><Camera size={20} /></div>
              <h3 className="text-base font-bold mb-1">I am the Camera</h3>
              <p className="text-xs text-white/40 leading-relaxed">Turn this phone into a streaming lens. Opens scanner.</p>
              <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors"><Radio size={60} /></div>
            </button>
            <button onClick={() => setMode('receiver')} className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/[0.01] group relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform"><Monitor size={20} /></div>
              <h3 className="text-base font-bold mb-1">I am the PC Monitor</h3>
              <p className="text-xs text-white/40 leading-relaxed">Host the stream display window. Generates QR matrix.</p>
              <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors"><CheckCircle size={60} /></div>
            </button>
          </div>
        )}

        {/* 2. CAMERA VIEW */}
        {mode === 'camera' && (
          <div className="w-full max-w-sm flex flex-col items-center h-full justify-center gap-4">
            {!isConnected ? (
              <>
                {/* Floating Status Pill */}
                <div className="w-full bg-white/[0.03] border border-white/10 rounded-full py-2 px-4 text-center shadow-lg backdrop-blur-sm">
                  <span className="text-xs font-semibold text-pink-400 flex items-center justify-center gap-2 tracking-wide">
                    <Radio size={14} className="animate-pulse" /> {status}
                  </span>
                </div>
                
                {/* Compact Scanner Card */}
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-center flex flex-col gap-3 shadow-xl">
                  <h4 className="text-sm font-bold">Align Scanner to PC Screen</h4>
                  <div id="reader" className="overflow-hidden rounded-xl bg-black border border-white/5 text-black max-w-full"></div>
                  <div className="flex gap-2 w-full mt-1">
                    <input type="text" placeholder="Or enter 6-Digit Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"/>
                    <button onClick={() => handleConnectToPC(remoteId)} className="bg-pink-500 text-black font-bold text-xs px-3 py-2 rounded-lg hover:bg-pink-400 active:scale-95 transition-all">Link</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full max-h-[75dvh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex items-center justify-center animate-in fade-in zoom-in-95">
                <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)` }} />
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
          <>
            {!isConnected && (
              <div className="flex flex-col items-center w-full max-w-xs z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Compact QR Card */}
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center shadow-xl">
                  <h3 className="text-sm font-bold mb-1">Scan to Pair Device</h3>
                  <p className="text-[10px] text-white/40 mb-3">Point mobile scanner at this code</p>
                  <div className="bg-white p-2 rounded-xl mb-3 flex justify-center items-center min-h-[140px] min-w-[140px]">
                    {peerId ? <QRCodeSVG value={peerId} size={130} /> : <div className="flex flex-col items-center gap-1 text-black/40"><RefreshCw className="animate-spin text-purple-600" size={18}/><span className="text-[10px]">Generating Key...</span></div>}
                  </div>
                  <div className="w-full bg-black/40 rounded-lg p-2 border border-white/5 overflow-hidden">
                    <span className="text-[8px] text-white/30 block uppercase tracking-wider mb-0.5">Manual Entry Code</span>
                    <code className="text-lg tracking-widest font-black text-purple-400 block leading-none">{peerId || '...'}</code>
                  </div>
                </div>

                {/* THE NEW FLOATING SINGLE-LINE STATUS PILL */}
                <div className="mt-5 flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-full shadow-lg backdrop-blur-sm">
                  <Radio size={16} className="text-pink-400 animate-pulse" />
                  <span className="text-xs font-semibold tracking-wide">Awaiting Stream Connection...</span>
                </div>
              </div>
            )}

            {/* Video container only visible when connected */}
            <div className={isConnected ? "fixed inset-0 w-full h-full bg-black z-0 flex items-center justify-center" : "hidden"}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }} 
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}