import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, MonitorSmartphone, Smartphone, Settings, ArrowLeftRight, Video, Sun, Moon } from 'lucide-react';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // 1. Detect system theme on initial load!
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // If system prefers dark, light mode is false. Otherwise, true.
      return !window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; 
  });
  
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);

  // 2. Listen for system theme changes in real-time
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsLightMode(!e.matches);
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Initialize Peer with Free Google STUN Servers
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
      setStatus('Ready! My ID is: ' + id);
    });

    // Handle receiving a call (PC Mode)
    peer.on('call', (call) => {
      setStatus('Receiving call...');
      call.answer(); 
      call.on('stream', (remoteStream) => {
        setStatus('Connected! Video receiving.');
        setIsConnected(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
    });

    peerInstance.current = peer;

    return () => peer.destroy();
  }, []);

  // QR Scanner Initialization
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          setRemoteId(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (errorMessage) => {} // Ignoring hidden scanner errors
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isScanning]);

  // Handle sending a call (Camera Mode)
  const startCameraAndCall = async () => {
    setStatus('Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      setStatus('Calling PC...');
      const call = peerInstance.current.call(remoteId, stream);
      
      call.on('stream', (remoteStream) => {
        // Catching the stream event
      });

      setStatus('Streaming to PC!');
      setIsConnected(true);
    } catch (err) {
      setStatus('Camera Error: ' + err.message);
    }
  };

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 transition-colors duration-300 ${isLightMode ? 'bg-gray-50 text-gray-900' : 'bg-[#0d0714] text-white'}`}>
      
      {/* Header Area */}
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
          <h1 className={`text-xl font-bold tracking-widest ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
            ZETCAM <span className="text-purple-500">PRO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dynamic Live Badge */}
          {isConnected && (
            <div className={`border px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-md ${isLightMode ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-purple-900/50 border-purple-500/30 text-purple-200'}`}>
              Streaming Live to PC!
            </div>
          )}

          {/* Theme Toggle Button */}
          <button 
            onClick={() => setIsLightMode(!isLightMode)}
            className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
            title="Toggle Theme"
          >
            {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        
        {/* --- PHONE (SENDER) CARD --- */}
        <div className={`border rounded-3xl p-6 backdrop-blur-md flex flex-col transition-colors duration-300 ${isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
          <div className={`flex items-center gap-2 mb-4 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
            <Smartphone className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Phone (Camera)</h2>
          </div>

          {/* Local Video Feed */}
          <div className={`w-full rounded-2xl overflow-hidden aspect-video relative mb-6 border shadow-inner ${isLightMode ? 'bg-gray-100 border-gray-200' : 'bg-black border-white/10 shadow-lg'}`}>
            {!isConnected && <div className="absolute inset-0 flex items-center justify-center text-gray-400"><Video className="w-12 h-12" /></div>}
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover relative z-10" />
          </div>

          {/* Controls Box - Disappears when connected! */}
          {!isConnected && (
            <div className={`rounded-2xl p-4 border space-y-4 ${isLightMode ? 'bg-gray-50 border-gray-100' : 'bg-black/20 border-white/5'}`}>
              
              {/* QR Scanner */}
              {isScanning ? (
                <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-white text-black"></div>
              ) : (
                <button 
                  onClick={() => setIsScanning(true)} 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <QrCode className="w-5 h-5" /> Scan PC Monitor QR Code
                </button>
              )}

              <div className={`flex items-center gap-4 text-xs font-medium uppercase tracking-wider my-4 ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`flex-1 h-px ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`}></div>
                OR USE MANUAL ID
                <div className={`flex-1 h-px ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`}></div>
              </div>

              {/* Manual Input */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter PC's ID..." 
                  value={remoteId} 
                  onChange={(e) => setRemoteId(e.target.value)} 
                  className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors ${isLightMode ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#1a1325] border-white/10 text-white placeholder-gray-500'}`}
                />
                <button 
                  onClick={startCameraAndCall} 
                  className={`px-6 py-3 rounded-xl font-medium transition-colors text-white ${isLightMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#2d1b4e] hover:bg-[#3d256a]'}`}
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* Bottom Utility Links */}
          <div className={`flex justify-between items-center mt-6 text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <button className={`flex items-center gap-2 transition-colors ${isLightMode ? 'hover:text-gray-900' : 'hover:text-white'}`}>
              <ArrowLeftRight className="w-4 h-4" /> Change Mode
            </button>
            <button className={`flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg border ${isLightMode ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:text-gray-900' : 'bg-white/5 border-white/5 hover:text-white'}`}>
              <Settings className="w-4 h-4" /> Video Settings
            </button>
          </div>
        </div>

        {/* --- PC (RECEIVER) CARD --- */}
        <div className={`border rounded-3xl p-6 backdrop-blur-md flex flex-col transition-colors duration-300 ${isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
          <div className={`flex items-center gap-2 mb-4 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
            <MonitorSmartphone className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">PC Monitor (Receiver)</h2>
          </div>

          <div className={`text-sm mb-6 p-3 rounded-xl border ${isLightMode ? 'bg-gray-50 border-gray-100 text-gray-600' : 'bg-black/20 border-white/5 text-gray-400'}`}>
            <strong>Status:</strong> <span className={isConnected ? "text-green-500 font-medium" : "text-pink-500 font-medium"}>{status}</span>
          </div>
          
          {/* Incoming Video Feed */}
          <div className={`w-full rounded-2xl overflow-hidden aspect-video relative mb-6 border shadow-inner ${isLightMode ? 'bg-gray-100 border-gray-200' : 'bg-black border-white/10 shadow-lg'}`}>
            {!isConnected && <div className="absolute inset-0 flex items-center justify-center text-gray-400"><Video className="w-12 h-12" /></div>}
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover relative z-10" />
          </div>

          {/* PC Connection Info - Disappears when connected! */}
          {!isConnected && (
            <div className={`flex flex-col items-center justify-center flex-1 rounded-2xl p-6 border ${isLightMode ? 'bg-gray-50 border-gray-100' : 'bg-black/20 border-white/5'}`}>
              <p className={`mb-4 text-sm font-medium ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>Scan this code with your phone:</p>
              
              {peerId ? (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
                  <QRCodeSVG value={peerId} size={160} />
                </div>
              ) : (
                <div className={`w-[160px] h-[160px] animate-pulse rounded-2xl mb-4 ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`}></div>
              )}
              
              <div className="text-center w-full">
                <p className={`text-xs uppercase tracking-wider mb-2 ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>Or enter this ID manually:</p>
                <code className={`block border rounded-xl px-4 py-3 font-mono text-sm break-all ${isLightMode ? 'bg-white border-gray-200 text-purple-600 shadow-sm' : 'bg-[#1a1325] border-white/10 text-pink-400'}`}>
                  {peerId || 'Generating ID...'}
                </code>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}