import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { 
  Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw, 
  Settings, SwitchCamera, Zap, ZapOff, RotateCw, XOctagon,
  Sun, Moon
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react'; 

export default function App() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteId, setRemoteId] = useState('');

  // --- Premium UI & Control States ---
  const [showSettings, setShowSettings] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDark, setIsDark] = useState(true); 
  const [remoteCommand, setRemoteCommand] = useState(null); 

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);
  const dataConnRef = useRef(null);
  const currentCallRef = useRef(null);
  const activeStreamRef = useRef(null);

  // --- Theme Auto-Detector ---
  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(matchMedia.matches);
    const listener = (e) => setIsDark(e.matches);
    matchMedia.addEventListener('change', listener);
    return () => matchMedia.removeEventListener('change', listener);
  }, []);

  const resetSystem = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
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

    // --- PC RECEIVER DATA CHANNEL SETUP ---
    peer.on('connection', (conn) => {
      dataConnRef.current = conn;
    });

    peer.on('call', (call) => {
      setStatus('Incoming feed...');
      call.answer();
      currentCallRef.current = call;
      call.on('stream', (remoteStream) => {
        setIsConnected(true);
        setStatus('Live!');
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });
      call.on('close', () => {
        resetSystem();
        setMode('home');
      });
    });

    peerInstance.current = peer;

    // --- STRICT BACK-CAMERA SCANNER FOR OLDER ANDROID SUPPORT ---
    if (mode === 'camera') {
      setTimeout(() => {
        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        try {
          const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0, 
            rememberLastUsedCamera: false, 
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

  // --- CONNECT TO PC (SENDER) ---
  const handleConnectToPC = async (targetPcId) => {
    setStatus('Mounting Stream...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }, 
        audio: false 
      });
      
      activeStreamRef.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      // 1. Establish Video Call
      const call = peerInstance.current.call(targetPcId, stream);
      currentCallRef.current = call;
      
      // 2. Establish Remote Control Data Channel
      const conn = peerInstance.current.connect(targetPcId);
      conn.on('open', () => {
        dataConnRef.current = conn;
      });
      conn.on('data', (data) => {
        setRemoteCommand(data); 
      });

      setIsConnected(true);
      setStatus('Live!');
    } catch (err) {
      setStatus('Hardware Error');
    }
  };

  // --- REMOTE EXECUTION LISTENER ---
  useEffect(() => {
    if (!remoteCommand) return;
    if (remoteCommand.cmd === 'TOGGLE_CAMERA') toggleCamera();
    if (remoteCommand.cmd === 'TOGGLE_FLASH') toggleFlash();
    setRemoteCommand(null);
  }, [remoteCommand]);

  // --- CAMERA CONTROLS ---
  const toggleCamera = async () => {
    if (!activeStreamRef.current) return;
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    setShowSettings(false);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (currentCallRef.current && currentCallRef.current.peerConnection) {
        const sender = currentCallRef.current.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }

      if (myVideoRef.current) myVideoRef.current.srcObject = newStream;
      
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = newStream;
      setIsFlashOn(false); 
    } catch (err) {
      console.error("Camera switch failed", err);
    }
  };

  const toggleFlash = async () => {
    if (!activeStreamRef.current) return;
    const track = activeStreamRef.current.getVideoTracks()[0];
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

  // --- REMOTE TRIGGER ACTIONS (PC SENDS COMMANDS) ---
  const handleRemoteToggleCamera = () => {
    if (dataConnRef.current) dataConnRef.current.send({ cmd: 'TOGGLE_CAMERA', t: Date.now() });
    setShowSettings(false);
  };
  
  const handleRemoteToggleFlash = () => {
    if (dataConnRef.current) dataConnRef.current.send({ cmd: 'TOGGLE_FLASH', t: Date.now() });
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

  // --- THEME STYLING CONFIG ---
  const themeBg = isDark ? "bg-[#120d1a] text-white" : "bg-[#f0f2f5] text-gray-900";
  const headerBorder = isDark ? "border-white/5" : "border-gray-200";
  const cardBg = isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200 shadow-md";
  const inputBg = isDark ? "bg-black/40 border-white/10 text-white focus:border-pink-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:border-pink-500";
  const mutedText = isDark ? "text-white/40" : "text-gray-500";
  const btnHover = isDark ? "hover:bg-white/10" : "hover:bg-gray-100";
  const menuBg = isDark ? "bg-[#1a1226] border-white/10" : "bg-white border-gray-200";
  const menuBtnHover = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";

  return (
    <div className={`h-[100dvh] w-full ${themeBg} font-sans antialiased p-4 flex flex-col items-center justify-start overflow-hidden selection:bg-pink-500/30 transition-colors duration-300`}>
      
      {/* GLOBAL OVERRIDES - Note the corrected #reader video selector */}
      <style>{`
        html, body, #root {
          background-color: ${isDark ? '#120d1a' : '#f0f2f5'} !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden !important; max-width: 100%;
        }
        #reader video { border-radius: 1rem; object-fit: cover !important; }
      `}</style>
      
      {/* HEADER */}
      <header className={`w-full max-w-4xl flex justify-between items-center relative z-50 transition-all ${mode === 'receiver' && isConnected ? 'mb-0 mt-2' : `mb-4 border-b ${headerBorder} pb-3`}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
            ZETCAM PRO <span className={`text-[9px] font-normal tracking-normal mt-1 ${mutedText}`}>v2.0</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {mode !== 'home' && (
            <button onClick={handleDisconnect} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all shadow-sm backdrop-blur-sm ${isDark ? 'bg-white/5 text-white/70 border-white/10 hover:text-white' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'}`}>
              <ArrowLeft size={14} /> Home
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`p-1.5 rounded-full transition-colors border shadow-sm backdrop-blur-sm ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white' : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Unified Settings Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-full transition-colors border shadow-sm backdrop-blur-sm ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white' : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'}`}
            >
              <Settings size={18} className={showSettings ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>

            {showSettings && (
              <div className={`absolute top-10 right-0 w-48 shadow-2xl rounded-xl p-2 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95 z-50 ${menuBg}`}>
                
                {isConnected && (
                  <>
                    <button onClick={mode === 'camera' ? toggleCamera : handleRemoteToggleCamera} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left transition-colors ${menuBtnHover}`}>
                      <SwitchCamera size={16} className="text-pink-500" /> Switch Camera
                    </button>
                    <button onClick={mode === 'camera' ? toggleFlash : handleRemoteToggleFlash} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left transition-colors ${menuBtnHover}`}>
                      <Zap size={16} className="text-yellow-500" /> Flash Toggle
                    </button>
                    <button onClick={handleRotate} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left transition-colors ${menuBtnHover}`}>
                      <RotateCw size={16} className="text-blue-500" /> Rotate Feed
                    </button>
                  </>
                )}

                {(mode !== 'home') && (
                  <button onClick={handleDisconnect} className={`flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-red-500/10 text-red-500 rounded-lg text-left transition-colors mt-1 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <XOctagon size={16} /> Disconnect
                  </button>
                )}
                
                {(!isConnected) && (
                  <div className={`px-3 py-2 text-xs text-center italic ${mutedText}`}>Connect device to unlock tools</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE CONTENT WRAPPER */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center relative min-h-0">

        {/* 1. HOME SCREEN */}
        {mode === 'home' && (
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-center items-stretch px-2">
            <button onClick={() => setMode('camera')} className={`flex-1 border rounded-2xl p-5 text-left transition-all group relative overflow-hidden ${cardBg} ${btnHover}`}>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-3 group-hover:scale-105 transition-transform"><Camera size={20} /></div>
              <h3 className="text-base font-bold mb-1">I am the Camera</h3>
              <p className={`text-xs leading-relaxed ${mutedText}`}>Turn this phone into a streaming lens. Opens scanner.</p>
            </button>
            <button onClick={() => setMode('receiver')} className={`flex-1 border rounded-2xl p-5 text-left transition-all group relative overflow-hidden ${cardBg} ${btnHover}`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-105 transition-transform"><Monitor size={20} /></div>
              <h3 className="text-base font-bold mb-1">I am the PC Monitor</h3>
              <p className={`text-xs leading-relaxed ${mutedText}`}>Host the stream display window. Generates QR matrix.</p>
            </button>
          </div>
        )}

        {/* 2. CAMERA VIEW */}
        {mode === 'camera' && (
          <div className="w-full max-w-sm flex flex-col items-center h-full justify-center gap-4">
            {!isConnected ? (
              <>
                <div className={`w-full border rounded-full py-2 px-4 text-center shadow-lg backdrop-blur-sm ${cardBg}`}>
                  <span className="text-xs font-semibold text-pink-500 flex items-center justify-center gap-2 tracking-wide">
                    <Radio size={14} className="animate-pulse" /> {status}
                  </span>
                </div>
                
                {/* Strict 1:1 Aspect Ratio Tile for Android Scanner */}
                <div className={`w-full border rounded-2xl p-4 text-center flex flex-col gap-3 shadow-xl ${cardBg}`}>
                  <h4 className="text-sm font-bold">Align Scanner to PC Screen</h4>
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-black border border-white/5 relative">
                    <div id="reader" className="w-full h-full text-black absolute inset-0 flex items-center justify-center"></div>
                  </div>
                  <div className="flex gap-2 w-full mt-1">
                    <input type="text" placeholder="Or enter 6-Digit Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none border ${inputBg}`}/>
                    <button onClick={() => handleConnectToPC(remoteId)} className="bg-pink-500 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-pink-600 active:scale-95 transition-all">Link</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full max-h-[75dvh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex items-center justify-center animate-in fade-in zoom-in-95">
                <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)` }} />
              </div>
            )}
          </div>
        )}

        {/* 3. RECEIVER VIEW */}
        {mode === 'receiver' && (
          <>
            {!isConnected && (
              <div className="flex flex-col items-center w-full max-w-xs z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`w-full border rounded-2xl p-5 text-center flex flex-col items-center shadow-xl ${cardBg}`}>
                  <h3 className="text-sm font-bold mb-1">Scan to Pair Device</h3>
                  <p className={`text-[10px] mb-3 ${mutedText}`}>Point mobile scanner at this code</p>
                  <div className="bg-white p-2 rounded-xl mb-3 flex justify-center items-center min-h-[140px] min-w-[140px] shadow-sm">
                    {peerId ? <QRCodeSVG value={peerId} size={130} /> : <div className="flex flex-col items-center gap-1 text-black/40"><RefreshCw className="animate-spin text-gray-400" size={18}/><span className="text-[10px]">Generating Key...</span></div>}
                  </div>
                  <div className={`w-full rounded-lg p-2 overflow-hidden ${isDark ? 'bg-black/40 border border-white/5' : 'bg-gray-100 border border-gray-200'}`}>
                    <span className={`text-[8px] block uppercase tracking-wider mb-0.5 ${mutedText}`}>Manual Entry Code</span>
                    <code className="text-lg tracking-widest font-black text-purple-500 block leading-none">{peerId || '...'}</code>
                  </div>
                </div>

                <div className={`mt-5 flex items-center gap-3 border px-5 py-3 rounded-full shadow-lg backdrop-blur-sm ${cardBg}`}>
                  <Radio size={16} className="text-pink-500 animate-pulse" />
                  <span className="text-xs font-semibold tracking-wide">Awaiting Stream Connection...</span>
                </div>
              </div>
            )}

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