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
    await mongoose.connect(uri);
    
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
