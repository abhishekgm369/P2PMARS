import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 2000) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`[DB] Connection error: ${err.message}`);
      retries -= 1;
      console.log(`[DB] Retries left: ${retries}. Waiting ${delay}ms...`);
      if (retries === 0) {
        console.error('[DB] Failed to connect to MongoDB. Exiting...');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
};

export default connectDB;
