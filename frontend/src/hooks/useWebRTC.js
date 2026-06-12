import { useEffect, useRef, useState } from 'react';

const CHUNK_SIZE = 65536; // 64KB per chunk

// Helper to calculate SHA-256 hash from ArrayBuffer
const calculateSHA256 = async (arrayBuffer) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const useWebRTC = (socket, roomId) => {
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const [connected, setConnected] = useState(false);
  
  const receivedBuffers = useRef([]);
  const receivedSize = useRef(0);
  const expectedSize = useRef(0);
  const expectedHash = useRef('');
  const currentFileName = useRef('');
  const pendingCandidates = useRef([]);
  
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStatus, setTransferStatus] = useState('idle');
  const [fatalError, setFatalError] = useState(null);
  const [incomingFile, setIncomingFile] = useState(null);
  const [receivedFiles, setReceivedFiles] = useState([]);
  
  // Speed and Hash verification states
  const [transferSpeed, setTransferSpeed] = useState(0);
  const [hashStatus, setHashStatus] = useState('idle'); // 'idle' | 'verifying' | 'verified' | 'failed'
  
  const bytesTransferred = useRef(0);
  const speedInterval = useRef(null);
  const isCancelled = useRef(false);
  const lastPercent = useRef(-1);
  const receivedUrls = useRef([]);

  const startSpeedTracking = () => {
    if (speedInterval.current) clearInterval(speedInterval.current);
    let prevBytes = 0;
    let prevTime = performance.now();
    
    speedInterval.current = setInterval(() => {
      const now = performance.now();
      const currentBytes = bytesTransferred.current;
      const timeDelta = (now - prevTime) / 1000; // in seconds
      const byteDelta = currentBytes - prevBytes;
      
      if (timeDelta > 0) {
        const speedMBs = (byteDelta / 1024 / 1024) / timeDelta; // MB/s
        setTransferSpeed(parseFloat(speedMBs.toFixed(2)));
      }
      
      prevBytes = currentBytes;
      prevTime = now;
    }, 1000);
  };

  const stopSpeedTracking = () => {
    if (speedInterval.current) {
      clearInterval(speedInterval.current);
      speedInterval.current = null;
    }
    setTransferSpeed(0);
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', roomId);

    socket.on('user-connected', async (userId) => {
      console.log('User connected, creating offer to', userId);
      createPeerConnection();
      
      dataChannel.current = peerConnection.current.createDataChannel('fileTransfer');
      setupDataChannel(dataChannel.current);

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { target: userId, offer });
    });

    socket.on('offer', async ({ target, offer }) => {
      console.log('Received offer');
      createPeerConnection();
      
      peerConnection.current.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        setupDataChannel(dataChannel.current);
      };

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      pendingCandidates.current.forEach(c => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e));
      });
      pendingCandidates.current = [];

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { target, answer });
    });

    socket.on('answer', async ({ target, answer }) => {
      console.log('Received answer');
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      pendingCandidates.current.forEach(c => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e));
      });
      pendingCandidates.current = [];
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (candidate) {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        } else {
          pendingCandidates.current.push(candidate);
        }
      }
    });

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      if (peerConnection.current) peerConnection.current.close();
      receivedUrls.current.forEach(u => URL.revokeObjectURL(u));
      stopSpeedTracking();
    };
  }, [socket, roomId]);

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      if (peerConnection.current.connectionState === 'connected') {
        setConnected(true);
      } else if (peerConnection.current.connectionState === 'disconnected' || peerConnection.current.connectionState === 'failed') {
        setConnected(false);
        cancelTransfer();
        if (peerConnection.current.connectionState === 'failed') {
          setFatalError('P2P connection failed or timed out');
        }
      }
    };
  };

  const setupDataChannel = (channel) => {
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 65535; // 64KB
    channel.onopen = () => console.log('Data channel is open');
    channel.onclose = () => {
      console.log('Data channel is closed');
      cancelTransfer();
    };
    channel.onerror = (err) => {
      console.error('Data channel error:', err);
      cancelTransfer();
    };
    
    channel.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const metadata = JSON.parse(event.data);
        if (metadata.type === 'file-start') {
          expectedSize.current = metadata.size;
          expectedHash.current = metadata.hash;
          currentFileName.current = metadata.name;
          receivedSize.current = 0;
          bytesTransferred.current = 0;
          receivedBuffers.current = [];
          lastPercent.current = 0;
          setTransferProgress(0);
          setHashStatus('idle');
          setTransferStatus('transferring');
          setIncomingFile({ name: metadata.name, size: metadata.size });
          startSpeedTracking();
        } else if (metadata.type === 'file-done') {
          stopSpeedTracking();
          setHashStatus('verifying');
          
          const blob = new Blob(receivedBuffers.current);
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const computedHash = await calculateSHA256(arrayBuffer);
            
            if (computedHash === expectedHash.current) {
              setHashStatus('verified');
              const url = URL.createObjectURL(blob);
              receivedUrls.current.push(url);
              
              const a = document.createElement('a');
              a.href = url;
              a.download = currentFileName.current;
              a.click();
              
              setReceivedFiles(prev => [...prev, { 
                id: Math.random().toString(), 
                name: currentFileName.current, 
                size: expectedSize.current, 
                url 
              }]);
              
              setTransferProgress(100);
              setTransferStatus('completed');
            } else {
              console.error('Cryptographic hash verification failed. Data is corrupted.');
              setHashStatus('failed');
              setTransferStatus('failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            setHashStatus('failed');
            setTransferStatus('failed');
          }
          setIncomingFile(null);
        } else if (metadata.type === 'file-cancel') {
          stopSpeedTracking();
          setIncomingFile(null);
          setTransferProgress(0);
          setHashStatus('idle');
          setTransferStatus('idle');
          receivedBuffers.current = [];
        }
      } else {
        receivedBuffers.current.push(event.data);
        receivedSize.current += event.data.byteLength;
        bytesTransferred.current = receivedSize.current;
        
        const percent = Math.floor((receivedSize.current / expectedSize.current) * 100);
        if (percent > lastPercent.current) {
          setTransferProgress(percent);
          lastPercent.current = percent;
        }
      }
    };
  };

  const sendFile = async (file) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') return;

    isCancelled.current = false;
    lastPercent.current = 0;
    setTransferStatus('transferring');
    setTransferProgress(0);
    setHashStatus('verifying'); // sender displays 'verifying' while generating hash
    bytesTransferred.current = 0;

    let hash = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      hash = await calculateSHA256(arrayBuffer);
      setHashStatus('verified'); // hash generated and verified locally
    } catch (err) {
      console.error('Failed to compute file hash:', err);
      setHashStatus('failed');
      setTransferStatus('failed');
      return;
    }

    dataChannel.current.send(JSON.stringify({
      type: 'file-start',
      name: file.name,
      size: file.size,
      hash: hash
    }));

    startSpeedTracking();

    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
      if (isCancelled.current) {
        stopSpeedTracking();
        return;
      }
      if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
        stopSpeedTracking();
        return;
      }
      
      try {
        dataChannel.current.send(e.target.result);
        offset += e.target.result.byteLength;
        bytesTransferred.current = offset;
        
        const percent = Math.floor((offset / file.size) * 100);
        if (percent > lastPercent.current) {
          setTransferProgress(percent);
          lastPercent.current = percent;
        }

        if (offset < file.size) {
          readSlice(offset);
        } else {
          stopSpeedTracking();
          dataChannel.current.send(JSON.stringify({ type: 'file-done' }));
          setTransferStatus('completed');
        }
      } catch (err) {
        console.error('Failed to send data chunk', err);
        cancelTransfer();
      }
    };

    const readSlice = (o) => {
      if (isCancelled.current) return;
      if (dataChannel.current.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
        dataChannel.current.onbufferedamountlow = () => {
          dataChannel.current.onbufferedamountlow = null;
          readNextSlice(o);
        };
        return;
      }
      readNextSlice(o);
    };

    const readNextSlice = (o) => {
      const slice = file.slice(o, o + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);
  };

  const cancelTransfer = () => {
    isCancelled.current = true;
    stopSpeedTracking();
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({ type: 'file-cancel' }));
    }
    setTransferProgress(0);
    setHashStatus('idle');
    setTransferStatus('failed');
  };

  return { 
    connected, 
    sendFile, 
    cancelTransfer, 
    transferProgress, 
    transferStatus, 
    fatalError, 
    incomingFile, 
    receivedFiles,
    transferSpeed,
    hashStatus
  };
};
