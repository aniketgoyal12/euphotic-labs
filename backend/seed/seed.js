import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from '../models/dish.js';

// ES Module pathname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dishdb';
  console.log(`Connecting to: ${uri} for seeding...`);

  try {
    // Try to connect to the configured URI with a 2-second timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch (error) {
    console.warn(`⚠️ Connection to configured URI failed: ${error.message}`);
    const fallbackUri = 'mongodb://127.0.0.1:27017/dishdb';
    console.log(`🔄 Attempting fallback to: ${fallbackUri}...`);
    try {
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 });
    } catch (fallbackError) {
      console.error('❌ Both configured and fallback database connections failed.');
      console.error('Please ensure MongoDB is running. You can start it using:');
      console.error('  mongod --dbpath <path_to_db_data> --port 27018 --replSet rs0');
      process.exit(1);
    }
  }

  try {
    // Read local seed dataset
    const seedFilePath = path.join(__dirname, 'dishes.json');
    const data = await fs.readFile(seedFilePath, 'utf8');
    const dishesToSeed = JSON.parse(data);

    // Wipe collection first to prevent duplicate key errors on dishId
    await Dish.deleteMany({});
    console.log('Cleared existing dish documents.');

    const result = await Dish.insertMany(dishesToSeed);
    console.log(`Successfully seeded ${result.length} dishes into the database.`);

  } catch (error) {
    console.error('Seeding process failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  }
};

seedDatabase();
