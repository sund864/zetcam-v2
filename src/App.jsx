import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { QRCodeSVG } from 'qrcode.react'; // Swapped to the stable package!
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [isScanning, setIsScanning] = useState(false);
  
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
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
    });

    peerInstance.current = peer;

    return () => peer.destroy();
  }, []);

  // 3. QR Scanner Initialization
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 200, height: 200 } },
        false
      );

      scanner.render(
        (decodedText) => {
          // When QR is found, set the ID, close the scanner, and clear the element
          setRemoteId(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (errorMessage) => {
          // The scanner constantly throws hidden errors while searching; we ignore them.
        }
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isScanning]);

  // 4. Handle sending a call (Camera Mode)
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
        // Catching the stream event just in case
      });

      setStatus('Streaming to PC!');
    } catch (err) {
      setStatus('Camera Error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>iOS Camera Test (QR Upgrade)</h2>
      <p><strong>Status:</strong> {status}</p>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid black' }}>
        <h3>I am the PC (Receiver)</h3>
        <p>Scan this to connect:</p>
        
        {/* Render the QR Code only when the peerId is successfully generated */}
        {peerId && (
          <div style={{ background: 'white', padding: '10px', display: 'inline-block', marginBottom: '10px' }}>
            <QRCodeSVG value={peerId} size={150} />
          </div>
        )}
        
        <p>Or manually enter ID: <strong>{peerId}</strong></p>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', backgroundColor: '#eee' }} />
      </div>

      <div style={{ padding: '10px', border: '1px solid black' }}>
        <h3>I am the Phone (Sender)</h3>
        
        {/* QR Scanner UI Area */}
        {isScanning ? (
          <div id="qr-reader" style={{ width: '100%', maxWidth: '300px', marginBottom: '10px' }}></div>
        ) : (
          <button onClick={() => setIsScanning(true)} style={{ padding: '5px 10px', marginBottom: '15px' }}>
            Open QR Scanner
          </button>
        )}
        
        <br />
        <input 
          type="text" 
          placeholder="Enter PC's ID here" 
          value={remoteId} 
          onChange={(e) => setRemoteId(e.target.value)} 
          style={{ padding: '5px', width: '200px' }}
        />
        <button onClick={startCameraAndCall} style={{ padding: '5px 10px', marginLeft: '10px' }}>
          Start Camera & Send
        </button>
        <br/><br/>
        <video ref={myVideoRef} autoPlay playsInline muted style={{ width: '150px', backgroundColor: '#eee' }} />
      </div>
    </div>
  );
}