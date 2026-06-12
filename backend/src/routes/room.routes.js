import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import Room from '../models/room.model.js';

const router = express.Router();

router.post('/create', protect, async (req, res, next) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const newRoom = await Room.create({
      roomId,
      senderId: req.user.id,
      status: 'waiting',
      expiresAt
    });
    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    next(err);
  }
});

router.get('/:roomId', protect, async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
});

router.post('/:roomId/join', protect, async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (room.status === 'waiting' && room.senderId.toString() !== req.user.id) {
      room.receiverId = req.user.id;
      room.status = 'connected';
      await room.save();
    }
    
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
});

router.put('/:roomId/close', protect, async (req, res, next) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId, senderId: req.user.id },
      { status: 'closed' },
      { returnDocument: 'after' }
    );
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or you are not authorized to close it' });
    }
    res.json({ success: true, message: 'Room closed successfully', room });
  } catch (err) {
    next(err);
  }
});

router.post('/:roomId/files', protect, async (req, res, next) => {
  try {
    const { name, size, status } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    room.files.push({ name, size, status });
    await room.save();
    
    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
});

export default router;
