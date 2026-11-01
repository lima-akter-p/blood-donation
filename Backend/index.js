
import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(process.env.MONGODB_URI);

// MongoDB Connection
export async function connectToMongoDB() {
  try {
    console.log("Trying to connect MongoDB...");

    await client.connect();

    console.log("MongoDB connected successfully!");

    return client;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

// Disconnect MongoDB
// export async function disconnectFromMongoDB() {
//   await client.close();
// }

// Home Route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start Server
const startServer = async () => {
  try {
    await connectToMongoDB();

    app.listen(port, () => {
      console.log(`Blood donation server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
