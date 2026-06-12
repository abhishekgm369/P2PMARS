import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import User from '../models/user.model.js';
import connectDB from './db.js';

dotenv.config({ path: '../../.env' }); 

const seedDB = async () => {
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb://localhost:27017/peerdrop';
  }

  try {
    await connectDB();
    
    await User.deleteMany({});
    console.log('[SEED] Cleared existing users.');

    const users = [];
    for (let i = 0; i < 10; i++) {
      users.push({
        email: faker.internet.email(),
        passwordHash: 'dummy_hash_for_seed',
        role: i === 0 ? 'admin' : 'user',
      });
    }

    await User.insertMany(users);
    console.log(`[SEED] Created ${users.length} mock users.`);

    console.log('[SEED] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
