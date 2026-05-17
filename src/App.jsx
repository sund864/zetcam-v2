import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Monitor, ArrowLeft, Radio, CheckCircle, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function App() {
  const [mode, setMode] = useState('home'); 
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('Initializing ZetNet...');
  const [isConnected, setIsConnected] = useState(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (mode === 'home') {
      if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
      if (scannerInstanceRef.current) {
        try { scannerInstanceRef.current.clear(); } catch (e) {}
        scannerInstanceRef.current = null;
      }
      setIsConnected(false);
      setPeerId('');
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
      setStatus('ZetNet Engine Active');
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
        if (!readerElement) return;

        try {
          const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 230, height: 230 },
            rememberLastUsedCamera: true
          }, false);

          scanner.render(
            (decodedText) => {
              scanner.clear().then(() => {
                scannerInstanceRef.current = null;
                handleConnectToPC(decodedText);
              }).catch(() => {
                handleConnectToPC(decodedText);
              });
            },
            () => {}
          );
          
          scannerInstanceRef.current = scanner;
        } catch (err) {
          setStatus("Scanner error: " + err.message);
        }
      }, 400); 
    }

    return () => {
      if (peer) peer.destroy();
      if (scannerInstanceRef.current) {
        try { scannerInstanceRef.current.clear(); } catch(e) {}
      }
    };
  }, [mode]);

  const handleConnectToPC = async (targetPcId) => {
    setStatus('Accessing camera hardware...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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

  return (
    <div className="min-h-screen w-full bg-[#120d1a] text-white font-sans antialiased p-4 md:p-6 flex flex-col items-center justify-start overflow-x-hidden selection:bg-pink-500/30">
      
      {/* FORCE KILL WHITE BORDERS (Direct Style Injection) */}
      <style>{`
        html, body, #root {
          background-color: #120d1a !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
          max-width: 100% !important;
        }
        #reader __video {
          object-fit: cover !important;
          border-radius: 1rem;
        }
      `}</style>
      
      {/* Responsive Header */}
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

      {/* ========================================================= */}
      {/* 1. HOME SCREEN - PREMIUM SPLIT CARDS                      */}
      {/* ========================================================= */}
      {mode === 'home' && (
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 justify-center items-stretch my-auto py-6">
          
          {/* Phone Card */}
          <button 
            onClick={() => setMode('camera')}
            className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left transition-all hover:border-pink-500/40 hover:bg-pink-500/[0.01] group relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-105 transition-transform">
              <Camera size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1">I am the Camera</h3>
            <p className="text-xs text-white/40 leading-relaxed">Turn this phone into a streaming lens. Opens the automatic QR scanner.</p>
            <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-pink-500/[0.05] transition-colors">
              <Radio size={70} />
            </div>
          </button>

          {/* PC Card */}
          <button 
            onClick={() => setMode('receiver')}
            className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/[0.01] group relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
              <Monitor size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1">I am the PC Monitor</h3>
            <p className="text-xs text-white/40 leading-relaxed">Host the stream display window. Generates the secure target QR matrix.</p>
            <div className="absolute -bottom-2 -right-2 text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors">
              <CheckCircle size={70} />
            </div>
          </button>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SENDER / CAMERA VIEW                                    */}
      {/* ========================================================= */}
      {mode === 'camera' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
            <span className="text-[13px] font-medium text-pink-400 flex items-center justify-center gap-2">
              <Radio size={14} className="animate-pulse" /> {status}
            </span>
          </div>

          {!isConnected ? (
            <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-center">
              <h4 className="text-md font-bold mb-3">Align Scanner to PC Screen</h4>
              <div id="reader" className="overflow-hidden rounded-xl bg-black border border-white/5 text-black max-w-full"></div>
            </div>
          ) : (
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative aspect-[3/4]">
              <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-emerald-500 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={10} /> Live Link Active
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RECEIVER / PC MONITOR VIEW                              */}
      {/* ========================================================= */}
      {mode === 'receiver' && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">
          <div className={`w-full flex flex-col ${isConnected ? 'lg:flex-row' : 'items-center'} gap-4`}>
            
            {!isConnected && (
              <div className="w-full max-w-xs bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center flex flex-col items-center">
                <h3 className="text-md font-bold mb-1">Scan to Pair Device</h3>
                <p className="text-[11px] text-white/40 mb-4">Point your mobile scanner at this code</p>
                
                <div className="bg-white p-3 rounded-xl mb-4">
                  {peerId ? (
                    <img 
                      src={`https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${peerId}`} 
                      alt="Pairing QR Code"
                      className="w-40 h-40 block"
                    />
                  ) : (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-black/40 gap-1">
                      <RefreshCw className="animate-spin text-purple-600" size={20} />
                      <span className="text-[10px]">Generating Key...</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/40 rounded-lg p-2 border border-white/5 max-w-full overflow-hidden">
                  <code className="text-[10px] text-purple-300 break-all block">{peerId || 'fetching setup...'}</code>
                </div>
              </div>
            )}

            <div className={`flex-1 bg-black rounded-2xl border border-white/10 relative overflow-hidden min-h-[380px] flex items-center justify-center ${isConnected ? 'w-full' : 'max-w-xs'}`}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain max-h-[65vh]" 
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
        </div>
      )}

    </div>
  );
}