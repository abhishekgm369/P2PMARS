import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['waiting', 'connected', 'completed', 'failed', 'closed'],
    default: 'waiting',
  },
  files: [{
    name: String,
    size: Number,
    status: String,
    date: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 
  }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
