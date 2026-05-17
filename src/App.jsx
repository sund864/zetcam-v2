import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('Initializing...');
  
  // This is our "Bouncer" variable!
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false); 

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);

  useEffect(() => {
    // 1. Initialize Peer with Free Google STUN Servers
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

    // 2. Handle receiving a call (PC Mode)
    peer.on('call', (call) => {
      setStatus('Receiving call...');
      call.answer(); 
      call.on('stream', (remoteStream) => {
        setStatus('Connected! Video receiving.');
        setIsReceiving(true);
        setIsConnected(true); // Tell the UI we are connected!
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
    });

    peerInstance.current = peer;
    return () => peer.destroy();
  }, []);

  // 3. Handle sending a call (Camera Mode on Phone)
  const startCameraAndCall = async () => {
    if (!remoteId) return alert("Please enter a PC ID first!");
    
    setStatus('Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      setStatus('Calling PC...');
      const call = peerInstance.current.call(remoteId, stream);
      
      call.on('stream', (remoteStream) => {
        // Catching just in case
      });

      // The call was successfully sent, hide the controls!
      setIsConnected(true); 
      setStatus('Streaming Live to PC!');
    } catch (err) {
      setStatus('Camera Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#160a1a] text-white font-sans p-4 flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <h1 className="text-xl font-bold tracking-widest uppercase">Zetcam Pro</h1>
        </div>
        
        {/* Only shows when connected */}
        {isConnected && (
          <div className="bg-purple-900/50 text-purple-200 text-xs px-3 py-1 rounded-full border border-purple-500/30">
            {status}
          </div>
        )}
      </div>

      {/* PC Status / ID - Only shows when NOT connected */}
      {!isConnected && (
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-400">Your PC ID for receiving:</p>
          <p className="text-pink-400 font-mono font-bold tracking-wide">{peerId || 'Generating...'}</p>
        </div>
      )}

      {/* Video Area */}
      <div className={`relative bg-black rounded-2xl overflow-hidden mb-6 transition-all duration-500 ${isConnected ? 'flex-grow' : 'h-64'}`}>
        {/* If we are the PC, show remote video. If we are the phone, show local camera */}
        {isReceiving ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
      </div>

      {/* The Controls - This entire block DISAPPEARS when isConnected is true! */}
      {!isConnected && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 shadow-xl">
          
          <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 rounded-xl mb-6 shadow-lg shadow-pink-500/20 active:scale-95 transition-transform">
            Scan PC Monitor QR Code
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-grow"></div>
            <span className="text-xs text-white/40 font-semibold tracking-wider">OR USE MANUAL ID</span>
            <div className="h-px bg-white/10 flex-grow"></div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              placeholder="Enter PC ID here..."
              className="flex-grow bg-[#0f0714] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button 
              onClick={startCameraAndCall}
              className="bg-[#2a1333] hover:bg-[#3a1b47] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav - Also disappears when connected */}
      {!isConnected && (
        <div className="flex justify-between items-center text-sm text-white/50 mt-auto pb-safe">
          <button className="hover:text-white transition-colors">&larr; Change Mode</button>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
            Video Settings
          </button>
        </div>
      )}

    </div>
  );
}