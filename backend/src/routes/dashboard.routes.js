import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import User from '../models/user.model.js';
import Room from '../models/room.model.js';

const router = express.Router();

router.get('/metrics', protect, async (req, res, next) => {
  try {
    let globalStats = {};
    if (req.user.role === 'admin') {
      globalStats = {
        totalUsers: await User.countDocuments(),
        totalRooms: await Room.countDocuments(),
        activeRooms: await Room.countDocuments({ status: 'connected' })
      };
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Fetch user's rooms
    const userRooms = await Room.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
    }).sort({ createdAt: -1 });

    let allFiles = [];
    userRooms.forEach(room => {
      room.files.forEach(file => {
        allFiles.push({
          id: file._id || Math.random().toString(),
          filename: file.name,
          size: file.size,
          status: file.status,
          date: file.date
        });
      });
    });

    // Sort by date desc
    allFiles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const startIndex = (page - 1) * limit;
    const recentHistory = allFiles.slice(startIndex, startIndex + limit);

    const myTotalRooms = userRooms.length;
    const myActiveRooms = userRooms.filter(r => r.status === 'connected' || r.status === 'waiting').length;
    const myTotalFiles = allFiles.length;

    res.json({
      success: true,
      data: {
        ...globalStats,
        myTotalRooms,
        myActiveRooms,
        myTotalFiles,
        recentHistory,
        page,
        limit
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
