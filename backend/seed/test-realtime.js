import mongoose from 'mongoose';
import { io } from 'socket.io-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Dish from '../models/dish.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testRealtimeUpdates = async () => {
  const uri = process.env.MONGODB_URI;
  console.log(`[TEST] Connecting to MongoDB: ${uri}`);
  
  // 1. Establish database connection
  await mongoose.connect(uri);
  
  // 2. Connect to Socket.IO Server
  const socket = io('http://localhost:5000');
  
  let changeReceived = false;

  socket.on('connect', () => {
    console.log('[TEST] Connected to Socket.IO server successfully.');
  });

  socket.on('dish_update', (payload) => {
    console.log('[TEST] Real-time dish_update event received from socket:', payload);
    if (payload.action === 'update' && payload.data.dishId === '5') {
      changeReceived = true;
      console.log('[TEST] Verified: Real-time update matches ID 5!');
    }
  });

  // Give socket connection a moment
  await new Promise(r => setTimeout(r, 1000));

  // 3. Trigger a database update directly on Alfredo Pasta (ID 5)
  console.log('[TEST] Fetching dish 5 from database...');
  const dish = await Dish.findOne({ dishId: '5' });
  if (!dish) {
    console.error('[TEST] Dish 5 not found in DB! Please seed the database first.');
    socket.disconnect();
    await mongoose.disconnect();
    process.exit(1);
  }

  const newStatus = !dish.isPublished;
  console.log(`[TEST] Changing isPublished status of "${dish.dishName}" to: ${newStatus}`);
  dish.isPublished = newStatus;
  await dish.save();
  console.log('[TEST] Saved document directly in MongoDB. Waiting for socket emission...');

  // Wait to see if event is received
  await new Promise(r => setTimeout(r, 2000));

  socket.disconnect();
  await mongoose.disconnect();

  if (changeReceived) {
    console.log('\n======================================');
    console.log('🎉 SUCCESS: REAL-TIME UPDATES ARE WORKING!');
    console.log('======================================\n');
    process.exit(0);
  } else {
    console.log('\n======================================');
    console.log('❌ FAILED: Real-time updates NOT received.');
    console.log('======================================\n');
    process.exit(1);
  }
};

testRealtimeUpdates();
