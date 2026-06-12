import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middlewares/error.middleware.js';
import { logRequest } from './utils/logger.js';
import connectDB from './utils/db.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import roomRoutes from './routes/room.routes.js';

dotenv.config();

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: frontendUrl }));
app.use(helmet());
app.use(express.json());
app.use(logRequest);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);

    socket.on('disconnect', async () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
      try {
        const Room = (await import('./models/room.model.js')).default;
        await Room.updateOne(
          { roomId, status: { $ne: 'closed' } }, 
          { status: 'closed' }
        );
      } catch (err) {
        console.error('Failed to close room on disconnect', err);
      }
    });

    socket.on('offer', (data) => {
      socket.to(roomId).emit('offer', data);
    }); 

    socket.on('answer', (data) => {
      socket.to(roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
      socket.to(roomId).emit('ice-candidate', data);
    });

    socket.on('room-closed', () => {
      socket.to(roomId).emit('room-closed');
    });
  });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  // Cleanup inactive rooms every 10 minutes
  setInterval(async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const Room = (await import('./models/room.model.js')).default;
      await Room.updateMany(
        { status: { $ne: 'closed' }, updatedAt: { $lt: twoHoursAgo } },
        { $set: { status: 'closed' } }
      );
    } catch (error) {
      console.error('Failed to cleanup inactive rooms', error);
    }
  }, 10 * 60 * 1000);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
