import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Monitor, Settings, QrCode, RefreshCw, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('Initializing ZetNet...');
  const [mode, setMode] = useState(null); // 'pc' or 'phone'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Video Settings States
  const [videoResolution, setVideoResolution] = useState('720p');
  const [fps, setFps] = useState('30');

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize Peer with Google STUN Servers for flawless routing
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
      setStatus('ZetNet Ready');
    });

    peer.on('call', (call) => {
      setStatus('Receiving live camera feed...');
      call.answer();
      call.on('stream', (remoteStream) => {
        setStatus('Streaming Live');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
    });

    peerInstance.current = peer;
    return () => {
      peer.destroy();
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  // Get camera constraints based on settings
  const getCameraConstraints = () => {
    const width = videoResolution === '1080p' ? 1920 : videoResolution === '720p' ? 1280 : 640;
    const height = videoResolution === '1080p' ? 1080 : videoResolution === '720p' ? 720 : 480;
    return {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: parseInt(fps) },
        facingMode: 'environment' // Uses back camera by default
      },
      audio: false
    };
  };

  // Start streaming from Phone to PC
  const startStreaming = async (targetId) => {
    const idToCall = targetId || remoteId;
    if (!idToCall) {
      alert('Please enter or scan a valid PC ID');
      return;
    }

    setStatus('Accessing mobile camera...');
    try {
      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      setStatus('Connecting to PC monitor...');
      const call = peerInstance.current.call(idToCall, stream);
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Camera Error: ' + err.message);
    }
  };

  // Trigger Mobile QR Scanner
  const startQRScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false);

      scanner.render((decodedText) => {
        setRemoteId(decodedText);
        setIsScanning(false);
        scanner.clear();
        // Instantly start stream upon successful scan
        startStreaming(decodedText);
      }, (error) => {
        // Silent catch for scanning frame errors
      });

      scannerRef.current = scanner;
    }, 100);
  };

  // Public QR Code API link generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${peerId}&color=160a1a&bgcolor=ffffff`;

  return (
    <div className="min-h-screen bg-[#160a1a] text-white font-sans flex flex-col justify-between p-4 selection:bg-pink-500 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto py-2 border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">ZETNET PRO</h1>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300 backdrop-blur-sm">
          {status}
        </span>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center my-6">
        
        {/* Welcome Screen (Choose Mode) */}
        {!mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
            <button 
              onClick={() => setMode('pc')}
              className="group p-8 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 hover:border-pink-500/50 transition-all duration-300 flex flex-col items-center gap-4 shadow-2xl hover:shadow-pink-500/10 text-center"
            >
              <div className="p-4 rounded-xl bg-purple-900/30 text-pink-400 group-hover:scale-110 transition-transform">
                <Monitor size={36} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Use as PC Monitor</h3>
                <p className="text-sm text-slate-400">Receive live camera streams from mobile devices here.</p>
              </div>
            </button>

            <button 
              onClick={() => setMode('phone')}
              className="group p-8 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 hover:border-pink-500/50 transition-all duration-300 flex flex-col items-center gap-4 shadow-2xl hover:shadow-pink-500/10 text-center"
            >
              <div className="p-4 rounded-xl bg-purple-900/30 text-pink-400 group-hover:scale-110 transition-transform">
                <Camera size={36} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Use as Wireless Camera</h3>
                <p className="text-sm text-slate-400">Stream your phone's camera directly to your PC monitor.</p>
              </div>
            </button>
          </div>
        )}

        {/* PC MODE INTERFACE */}
        {mode === 'pc' && (
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
            {/* Live Feed Container */}
            <div className="relative w-full max-w-3xl aspect-video rounded-2xl bg-black/40 border border-purple-500/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-md">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {!remoteVideoRef.current?.srcObject && (
                <div className="absolute text-center text-slate-500 flex flex-col items-center gap-2">
                  <Monitor size={48} className="text-purple-500/30 animate-bounce" />
                  <p className="text-sm">Waiting for wireless camera stream...</p>
                </div>
              )}
            </div>

            {/* QR Connection Dock */}
            <div className="w-full lg:w-80 p-6 rounded-2xl bg-gradient-to-b from-purple-950/30 to-black/30 border border-purple-500/10 flex flex-col items-center text-center shadow-xl">
              <h4 className="font-semibold text-sm tracking-wider uppercase text-purple-300 mb-4 flex items-center gap-2">
                <QrCode size={16} /> Instant Connect
              </h4>
              
              {peerId ? (
                <div className="bg-white p-3 rounded-xl shadow-2xl mb-4 transition-all hover:scale-105">
                  <img src={qrCodeUrl} alt="Scan to Connect" className="w-40 h-40" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-purple-950/50 rounded-xl mb-4 flex items-center justify-center border border-dashed border-purple-500/30">
                  <RefreshCw className="animate-spin text-purple-400" />
                </div>
              )}
              
              <p className="text-xs text-slate-400 px-2">
                Scan this code using your phone's camera inside the ZetNet app to instantly push your stream here.
              </p>
            </div>
          </div>
        )}

        {/* PHONE MODE INTERFACE */}
        {mode === 'phone' && (
          <div className="max-w-md w-full mx-auto flex flex-col gap-4">
            
            {/* Mobile Viewfinder Panel */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-black/40 border border-purple-500/20 overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {isScanning && (
                <div className="absolute inset-0 bg-black/90 p-4 flex flex-col z-20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-pink-400 font-mono">Scanning QR Code...</span>
                    <button onClick={() => setIsScanning(false)} className="p-1 rounded-full bg-white/10 text-white"><X size={16} /></button>
                  </div>
                  <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-black"></div>
                </div>
              )}

              {!myVideoRef.current?.srcObject && !isScanning && (
                <div className="absolute text-center text-slate-500 flex flex-col items-center gap-2">
                  <Camera size={48} className="text-purple-500/30" />
                  <p className="text-sm">Camera idle. Ready to broadcast.</p>
                </div>
              )}
            </div>

            {/* Mobile Connection Controls */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/10 flex flex-col gap-3">
              <button 
                onClick={startQRScanner}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-[0.98] transition-all rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20 text-white"
              >
                <QrCode size={18} /> Scan PC Monitor QR Code
              </button>

              <div className="relative flex items-center my-1">
                <div className="flex-grow border-t border-purple-950"></div>
                <span className="flex-shrink mx-3 text-xs uppercase tracking-widest text-slate-600">or use manual ID</span>
                <div className="flex-grow border-t border-purple-950"></div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter PC Monitor ID" 
                  value={remoteId} 
                  onChange={(e) => setRemoteId(e.target.value)} 
                  className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-purple-900/50 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                />
                <button 
                  onClick={() => startStreaming()}
                  className="px-5 rounded-xl bg-purple-900/40 border border-purple-500/20 hover:bg-purple-900/60 font-medium text-sm transition-colors text-purple-200"
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Quick Action Floating Bar */}
            <div className="flex justify-between items-center px-2 text-slate-400">
              <button onClick={() => setMode(null)} className="text-xs hover:text-white transition-colors">← Change Mode</button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 text-xs hover:text-white bg-purple-950/30 border border-purple-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Settings size={14} /> Video Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* REUSABLE PREMIUM MOBILE SETTINGS OVERLAY */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#1d1124] border-t sm:border border-purple-500/20 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-wide flex items-center gap-2 text-pink-400">
                <Settings size={18} /> Stream Configurations
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full bg-purple-950 text-purple-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Video Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {['480p', '720p', '1080p'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setVideoResolution(res)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all ${videoResolution === res ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' : 'bg-purple-950/40 border-purple-900/40 text-slate-400 hover:bg-purple-900/30'}`}
                    >
                      {res === '1080p' ? '1080p (FHD)' : res === '720p' ? '720p (HD)' : '480p (SD)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Target Frame Rate</label>
                <div className="grid grid-cols-2 gap-2">
                  {['30', '60'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all ${fps === f ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' : 'bg-purple-950/40 border-purple-900/40 text-slate-400 hover:bg-purple-900/30'}`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setIsSettingsOpen(false);
                if (myVideoRef.current?.srcObject) {
                  // If streaming, instantly re-apply changes
                  startStreaming();
                }
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg"
            >
              Apply Configurations
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center text-[10px] text-slate-600 tracking-widest pb-safe pt-2">
        ZETNET STREAMING ENGINE • ULTRA LOW LATENCY WIRELESS WEBCAM
      </footer>
    </div>
  );
}