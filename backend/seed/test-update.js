import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Dish from '../models/dish.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testUpdate = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dishdb';
  console.log(`Connecting to database at ${uri}...`);

  try {
    // Try to connect to configured URI with 2-second timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch (error) {
    console.warn(`⚠️ Connection to configured URI failed: ${error.message}`);
    const fallbackUri = 'mongodb://127.0.0.1:27017/dishdb';
    console.log(`🔄 Attempting fallback to: ${fallbackUri}...`);
    try {
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 });
    } catch (fallbackError) {
      console.error('❌ Both configured and fallback database connections failed.');
      process.exit(1);
    }
  }

  try {

    // Find Alfredo Pasta (ID 5) and toggle its publication status directly in DB
    const item = await Dish.findOne({ dishId: '5' });
    if (!item) {
      console.log('Alfredo Pasta not found. Run the seed script first.');
      return;
    }

    const previousState = item.isPublished;
    item.isPublished = !item.isPublished;
    const result = await item.save();

    console.log(`Direct DB update successful:`);
    console.log(`Dish: "${result.dishName}"`);
    console.log(`Published status changed: ${previousState} -> ${result.isPublished}`);

  } catch (error) {
    console.error('Error modifying DB:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  }
};

testUpdate();
