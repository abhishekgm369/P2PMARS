import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return socket;
};
