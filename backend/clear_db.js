import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/leadgensite';

async function clearDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    // Explicitly target the collection Mongoose creates for the Lead model
    await mongoose.connection.db.dropCollection('leads');
    console.log('✅ All old cached leads successfully wiped out!');
  } catch (error) {
    if (error.code === 26) {
        console.log('✅ Database is already perfectly clean!');
    } else {
        console.error('Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

clearDB();
