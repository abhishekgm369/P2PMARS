import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, CheckCircle, XCircle, ShieldCheck, Activity, Info, Link as LinkIcon, Download, LogOut, Copy } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import Button from '../components/Button.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ShareRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { 
    connected, 
    sendFile, 
    transferProgress, 
    transferStatus, 
    fatalError, 
    incomingFile, 
    receivedFiles, 
    cancelTransfer,
    transferSpeed,
    hashStatus 
  } = useWebRTC(socket, id);
  const { user } = useAuth();
  
  const [files, setFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSender, setIsSender] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${id}`);
        if (res.data.success) {
          const isSenderUser = res.data.room.senderId === user?.id;
          setIsSender(isSenderUser);
          
          if (!isSenderUser && res.data.room.status === 'waiting') {
            await api.post(`/rooms/${id}/join`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch room", err);
      }
    };
    if (user) {
      fetchRoom();
    }
  }, [id, user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleRoomClosed = () => {
      alert('The room has been closed by the sender.');
      navigate('/dashboard');
    };
    
    const handleUserDisconnected = () => {
      setPeerDisconnected(true);
    };

    socket.on('room-closed', handleRoomClosed);
    socket.on('user-disconnected', handleUserDisconnected);
    
    return () => {
      socket.off('room-closed', handleRoomClosed);
      socket.off('user-disconnected', handleUserDisconnected);
    };
  }, [socket, navigate]);

  const closeRoom = async () => {
    try {
      if (isSender) {
        await api.put(`/rooms/${id}/close`);
        socket.emit('room-closed');
      }
      setIsModalOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to close room', err);
      setIsModalOpen(false);
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (fatalError) {
      alert(`Critical error: ${fatalError}. The room will be closed.`);
      closeRoom();
    }
  }, [fatalError]);

  useEffect(() => {
    if (!connected || !isSender) return;

    if (!activeFileId) {
      const nextFile = files.find(f => f.status === 'pending');
      if (nextFile) {
        setActiveFileId(nextFile.id);
        setFiles(prev => prev.map(f => f.id === nextFile.id ? { ...f, status: 'transferring' } : f));
        sendFile(nextFile.file);
      }
    }
  }, [files, activeFileId, connected, isSender, sendFile]);

  useEffect(() => {
    if (activeFileId) {
      if (transferStatus === 'completed') {
        setFiles(prev => {
          const current = prev.find(f => f.id === activeFileId);
          if (current && current.status !== 'completed') {
            api.post(`/rooms/${id}/files`, { name: current.file.name, size: current.file.size, status: 'completed' }).catch(console.error);
          }
          return prev.map(f => f.id === activeFileId ? { ...f, status: 'completed', progress: 100 } : f);
        });
        setActiveFileId(null);
      } else if (transferStatus === 'failed') {
        setFiles(prev => {
          const current = prev.find(f => f.id === activeFileId);
          if (current && current.status !== 'failed') {
            api.post(`/rooms/${id}/files`, { name: current.file.name, size: current.file.size, status: 'failed' }).catch(console.error);
          }
          return prev.map(f => f.id === activeFileId ? { ...f, status: 'failed', progress: 0 } : f);
        });
        setActiveFileId(null);
      } else if (transferStatus === 'transferring') {
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, progress: transferProgress } : f));
      }
    }
  }, [transferStatus, transferProgress, activeFileId, id]);

  useEffect(() => {
    let timeout;
    
    if (connected) {
      if (transferStatus !== 'transferring' && activeFileId === null) {
        timeout = setTimeout(() => {
          alert('Room closed due to inactivity (5 minutes idle).');
          closeRoom();
        }, 5 * 60 * 1000);
      }
    } else {
      timeout = setTimeout(() => {
        alert('Room closed because no one joined within 5 minutes.');
        closeRoom();
      }, 5 * 60 * 1000);
    }
    
    return () => clearTimeout(timeout);
  }, [connected, transferStatus, activeFileId]);

  const onDrop = useCallback(acceptedFiles => {
    setFileError(null);
    const validFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }));
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  const onDropRejected = useCallback(fileRejections => {
    if (fileRejections.length > 0) {
      let errorMsg = `Rejected ${fileRejections.length} file(s). `;
      
      const errors = fileRejections[0].errors.map(e => e.code);
      if (errors.includes('too-many-files')) errorMsg += 'Maximum 10 files allowed at once. ';
      if (errors.includes('file-too-large')) errorMsg += 'Maximum size is 100MB per file. ';
      if (errors.includes('folder-drop')) errorMsg += 'Folders/Apps are not supported (please zip them). ';
      if (errors.includes('empty-file')) errorMsg += 'Empty files are not allowed. ';
      
      setFileError(errorMsg.trim());
      setTimeout(() => setFileError(null), 5000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    onDropRejected,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 10
  });

  const handleCancel = (fileId) => {
    if (fileId === activeFileId) {
      cancelTransfer();
    } else {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'failed' } : f));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Room link copied!');
  };

  const getHashBadge = () => {
    if (hashStatus === 'verifying') {
      return (
        <div className="flex items-center text-amber-700 bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
          <Activity className="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-600" />
          Verifying SHA-256 Checksum...
        </div>
      );
    }
    if (hashStatus === 'verified') {
      return (
        <div className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
          SHA-256 Verified Secure
        </div>
      );
    }
    if (hashStatus === 'failed') {
      return (
        <div className="flex items-center text-rose-700 bg-rose-50 border border-rose-200/50 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
          Integrity Mismatch
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Structural layout: Two columns split screen workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Workspace settings and status */}
        <div className="space-y-6">
          <div className="nordic-panel p-6 sm:p-8 border border-[#E6E5DF] bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#60666D]">Session Room</span>
            <h1 className="text-xl font-extrabold text-[#1C1C1C] tracking-tight mt-1 mb-6 flex items-center">
              Room: <span className="font-mono text-[#2E5A44] ml-1.5 tracking-wider text-sm select-all">{id}</span>
            </h1>

            {/* Inline invite widget */}
            <div className="p-4 rounded-2xl bg-[#F4F3EE] border border-[#E6E5DF] mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#60666D] mb-1.5 block">Invite Link</label>
              <div className="flex items-center bg-white border border-[#E6E5DF] rounded-xl overflow-hidden mt-1">
                <span className="px-3 py-1.5 text-xs text-[#60666D] font-mono truncate select-all flex-grow">
                  {window.location.href}
                </span>
                <button 
                  onClick={copyLink}
                  className="bg-[#F4F3EE] hover:bg-[#EAE8E0] p-2.5 border-l border-[#E6E5DF] text-[#1C1C1C] transition duration-200"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Connection Card */}
              <div className="p-4 rounded-xl border border-[#E6E5DF] bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#60666D] block mb-2">Peer Connection</span>
                {connected ? (
                  <div className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E5A44] shadow-lg shadow-[#2E5A44]/50"></span>
                    </span>
                    <span className="text-[#2E5A44] text-xs font-bold uppercase tracking-wider">Connected to Peer</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C96E50] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C96E50]"></span>
                    </span>
                    <span className="text-[#C96E50] text-xs font-bold uppercase tracking-wider">Waiting for Peer to Join...</span>
                  </div>
                )}
              </div>

              {/* Real-time speed monitor */}
              {transferStatus === 'transferring' && (
                <div className="p-4 rounded-xl border border-[#E6E5DF] bg-white flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60666D]">Transfer Speed</span>
                  <div className="flex items-center gap-1.5 text-[#2E5A44] font-bold text-sm">
                    <Activity className="w-4 h-4 animate-pulse text-[#2E5A44]" />
                    {transferSpeed} MB/s
                  </div>
                </div>
              )}

              {getHashBadge()}

              {peerDisconnected && (
                <div className="p-4 bg-rose-50 border border-rose-200/50 rounded-xl flex items-start space-x-2 text-rose-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">The remote peer disconnected. This session is closed.</p>
                </div>
              )}
            </div>

            <div className="h-px bg-[#E6E5DF] w-full my-6" />

            {/* Room termination button */}
            {isSender ? (
              <Button 
                onClick={closeRoom} 
                variant="danger" 
                className="w-full !py-2.5 font-bold text-xs"
              >
                <LogOut className="w-4 h-4 mr-2" />
                TERMINATE ROOM
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline" 
                className="w-full !py-2.5 font-bold text-xs"
              >
                <LogOut className="w-4 h-4 mr-2" />
                LEAVE ROOM
              </Button>
            )}

          </div>
        </div>

        {/* Right column: Dropzone / Transfer Board */}
        <div className="lg:col-span-2 space-y-6">
          {isSender ? (
            <>
              {/* Soft woven dropzone */}
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 relative overflow-hidden bg-white border-[#E6E5DF] ${
                  isDragActive 
                    ? 'border-[#2E5A44] bg-[#2E5A44]/5' 
                    : 'hover:border-[#2E5A44]/60 hover:bg-[#F4F3EE]/20'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-5">
                  <div className="p-4.5 bg-[#FAF9F6] border border-[#E6E5DF] rounded-2xl text-[#2E5A44]">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1C1C] tracking-tight">Drag and drop your files</h3>
                    <p className="text-xs text-[#60666D] mt-1.5">or click to browse from local storage</p>
                    
                    <div className="mt-8 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E6E5DF] max-w-sm mx-auto text-[10px] text-[#60666D] leading-relaxed">
                      <div className="flex items-center gap-1.5 text-[#1C1C1C] font-bold mb-1 justify-center uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 text-[#2E5A44]" />
                        Direct Peer Stream
                      </div>
                      We utilize WebRTC Data Channels. Your files bypass all servers and stream securely browser-to-browser.
                      <br />
                      <span className="font-bold text-[#1C1C1C] block mt-1.5">Limits: 100MB per file • 10 files limit</span>
                    </div>
                  </div>
                </div>
              </div>

              {fileError && (
                <div className="p-4 bg-rose-50 border border-rose-200/50 rounded-2xl flex items-start space-x-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Upload Rejected</h4>
                    <p className="text-xs text-rose-700 mt-1">{fileError}</p>
                  </div>
                </div>
              )}

              {/* File list cards instead of table */}
              {files.length > 0 && (
                <div className="nordic-panel border border-[#E6E5DF] bg-white overflow-hidden">
                  <div className="px-6 py-4.5 border-b border-[#E6E5DF] bg-[#F4F3EE]/20 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#1C1C1C]">Active Transfers</h2>
                    <span className="text-[10px] font-bold bg-[#2E5A44]/10 text-[#2E5A44] border border-[#2E5A44]/20 px-2.5 py-1 rounded-full">{files.length} Files</span>
                  </div>
                  <ul className="divide-y divide-[#E6E5DF] bg-transparent">
                    {files.map(f => (
                      <li key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6]/30 transition">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="p-2.5 bg-[#F4F3EE] text-[#60666D] border border-[#E6E5DF] rounded-xl shrink-0">
                            <FileIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C1C1C] truncate max-w-[200px] sm:max-w-xs">{f.file.name}</p>
                            <p className="text-[10px] text-[#60666D] mt-0.5">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 sm:w-1/2">
                          <div className="flex-grow bg-[#F4F3EE] rounded-full h-2 overflow-hidden border border-[#E6E5DF]">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                f.progress === 100 
                                  ? 'bg-[#2E5A44]' 
                                  : f.status === 'failed' 
                                    ? 'bg-rose-600' 
                                    : 'bg-[#C96E50]'
                              }`} 
                              style={{ width: `${f.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-[#1C1C1C] w-10 text-right">{f.progress}%</span>
                          {f.progress === 100 ? (
                            <CheckCircle className="w-5 h-5 text-[#2E5A44] shrink-0" />
                          ) : (
                            <button onClick={() => handleCancel(f.id)} className="text-[#60666D] hover:text-rose-600 transition shrink-0">
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Receiver Workspace
            <div className="nordic-panel border border-[#E6E5DF] bg-white p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-5 max-w-md mx-auto">
                <div className="p-4.5 bg-[#FAF9F6] border border-[#E6E5DF] rounded-2xl text-[#2E5A44]">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1C1C1C] tracking-tight">Direct Receive Node</h3>
                  <p className="text-xs text-[#60666D] mt-1.5 leading-relaxed">
                    Successfully linked to sender browser. Keep this window open. Dropped files will stream and download directly to your computer.
                  </p>
                </div>
                
                {/* Incoming transfer progress card */}
                {incomingFile && (
                  <div className="w-full mt-6 p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E5DF] text-left">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-[#1C1C1C] truncate max-w-[200px]">{incomingFile.name}</p>
                      <span className="text-[10px] font-bold text-[#2E5A44] bg-[#2E5A44]/10 border border-[#2E5A44]/25 px-2 py-0.5 rounded-full">{transferSpeed} MB/s</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-grow bg-[#F4F3EE] rounded-full h-2 overflow-hidden border border-[#E6E5DF]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 bg-[#C96E50]" 
                          style={{ width: `${transferProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#1C1C1C] w-10 text-right">{transferProgress}%</span>
                    </div>
                  </div>
                )}
                
                {/* Received files feed cards */}
                {receivedFiles.length > 0 && (
                  <div className="w-full mt-8 text-left">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#60666D] mb-3">Incoming Transfers</h4>
                    <ul className="space-y-3">
                      {receivedFiles.map(rf => (
                        <li key={rf.id} className="flex justify-between items-center p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E5DF] hover:border-[#C8C7C0] transition duration-200">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileIcon className="w-4 h-4 text-[#2E5A44] shrink-0" />
                            <span className="text-xs font-bold text-[#1C1C1C] truncate max-w-[180px]">{rf.name}</span>
                          </div>
                          <a 
                            href={rf.url} 
                            download={rf.name} 
                            className="text-[10px] font-bold text-white bg-[#2E5A44] hover:bg-[#224433] px-3.5 py-2 rounded-xl transition duration-200 flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ShareRoom;
