import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dishdb';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Error connecting to configured MongoDB: ${error.message}`);
    const fallbackUri = 'mongodb://127.0.0.1:27017/dishdb';
    console.log(`🔄 Attempting fallback database connection to: ${fallbackUri}...`);
    try {
      const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected (Fallback): ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (fallbackError) {
      console.error(`❌ Fallback connection also failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};
