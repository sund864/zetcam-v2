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

  // --- THE FIX: Asynchronous hardware shutdown before changing screens ---
  const handleGoHome = async () => {
    setStatus('Safely powering down camera...');

    // 1. Stop any active live streams
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      myVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }

    // 2. Wait for the QR Scanner hardware to completely power off
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop(); // Pauses React until lens is off
        }
        scannerInstanceRef.current.clear();
      } catch (e) {
        console.log("Scanner shutdown skipped or already closed.");
      }
      scannerInstanceRef.current = null;
    }

    // 3. Close the network connection
    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }

    // 4. Finally, return to the home screen safely
    setIsConnected(false);
    setPeerId('');
    setRemoteId('');
    setMode('home');
  };

  useEffect(() => {
    let isActive = true; // Prevents zombie states if user clicks too fast

    if (mode === 'home') return; // Completely idle on the home screen

    const peer = new Peer({
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
      setStatus('Zetcam Engine Active');
    });

    peer.on('error', (err) => {
      if (!isActive) return;
      setStatus("Engine Error: " + err.type);
    });

    peer.on('call', (call) => {
      setStatus('Incoming feed detected...');
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
                // Instantly power off scanner on successful read
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
                // Failsafe: if user clicked Back while camera was booting
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

  return (
    <div className={
      "min-h-screen w-full bg-[#120d1a] text-white font-sans antialiased " +
      "p-4 md:p-6 flex flex-col items-center justify-start overflow-x-hidden selection:bg-pink-500/30"
    }>
      
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
      
      <header className={
        "w-full max-w-4xl flex justify-between items-center mb-6 " +
        "border-b border-white/5 pb-4"
      }>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            ZETCAM PRO <span className="text-[10px] font-normal text-white/30">v2.0</span>
          </h1>
        </div>
        {mode !== 'home' && (
          <button 
            onClick={handleGoHome}
            className={
              "flex items-center gap-1.5 text-xs text-white/70 hover:text-white " +
              "bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all"
            }
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </header>

      {mode === 'home' && (
        <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-6 justify-center items-stretch my-auto py-10">
          <button 
            onClick={() => setMode('camera')}
            className={
              "flex-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-left " +
              "transition-all hover:border-pink-500/40 hover:bg-pink-500/[0.01] group relative overflow-hidden"
            }
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

          <div className={
            "w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-center flex flex-col gap-3 " +
            (isConnected ? 'hidden' : 'block')
          }>
            <h4 className="text-md font-bold">Align Scanner to PC Screen</h4>
            
            <div id="reader" className={
              "overflow-hidden rounded-xl bg-black/50 border border-white/5 " +
              "text-white max-w-full min-h-[280px] flex items-center justify-center relative"
            }>
               <span className="text-xs text-white/30 absolute z-0">Loading Scanner...</span>
            </div>
            
            <div className="text-xs text-white/30 my-1">— OR USE MANUAL BACKUP —</div>
            
            <div className="flex gap-2 w-full">
              <input 
                type="text" 
                placeholder="Paste PC Raw ID String" 
                value={remoteId} 
                onChange={(e) => setRemoteId(e.target.value)}
                className={
                  "flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 " +
                  "text-xs text-white focus:outline-none focus:border-pink-500"
                }
              />
              <button 
                onClick={executeManualConnect}
                className={
                  "bg-pink-500 text-black font-bold text-xs px-4 py-2 " +
                  "rounded-lg hover:bg-pink-400 active:scale-95 transition-all"
                }
              >
                Connect
              </button>
            </div>
          </div>

          <div className={
            "w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative aspect-[3/4] " +
            (!isConnected ? 'hidden' : 'block')
          }>
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className={
              "absolute top-4 right-4 bg-emerald-500 text-black text-[10px] font-black " +
              "uppercase px-3 py-1.5 rounded-full flex items-center gap-1"
            }>
              <CheckCircle size={12} /> Live Link Active
            </div>
          </div>
        </div>
      )}

      {mode === 'receiver' && (
        <div className={
          "w-full flex flex-col items-center gap-6 " +
          (isConnected ? 'max-w-full px-0 md:px-6' : 'max-w-5xl')
        }>
          <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6">
            
            {!isConnected && (
              <div className={
                "w-full md:w-1/3 bg-white/[0.02] border border-white/10 rounded-3xl " +
                "p-6 text-center flex flex-col items-center justify-center shrink-0"
              }>
                <h3 className="text-lg font-bold mb-2">Scan to Pair Device</h3>
                <p className="text-[12px] text-white/40 mb-6">Point your mobile scanner at this code</p>
                
                <div className="bg-white p-4 rounded-2xl mb-6 flex justify-center items-center min-h-[180px] min-w-[180px]">
                  {peerId ? (
                    <QRCodeSVG value={peerId} size={160} />
                  ) : (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-black/40 gap-2">
                      <RefreshCw className="animate-spin text-purple-600" size={24} />
                      <span className="text-xs">Generating Key...</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/40 rounded-xl p-3 border border-white/5 max-w-full overflow-hidden">
                  <code className="text-xs text-purple-300 break-all block">{peerId || 'fetching setup...'}</code>
                </div>
              </div>
            )}

            <div className={
              "bg-black rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center " +
              (isConnected ? 'w-full h-[calc(100vh-130px)]' : 'w-full md:w-2/3 min-h-[400px]')
            }>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain" 
              />
              
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-4 text-center p-6">
                  <div className="p-5 bg-white/5 rounded-full border border-white/10 text-white/40 animate-pulse">
                    <Radio size={40} />
                  </div>
                  <h4 className="text-lg font-bold">Awaiting Stream Connection</h4>
                  <p className="text-sm text-white/40 max-w-sm leading-relaxed">Video input frames will mount here as soon as the phone reads the authentication matrix.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}