import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/index.js';
import dishRoutes from './routes/dishRoutes.js';
import Dish from './models/dish.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for API routes
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/dishes', dishRoutes);

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // Useful for tracking client connections
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const initApp = async () => {
  await connectDB();

  const setupChangeStream = () => {
    console.log('Setting up MongoDB Change Stream...');
    try {
      const changeStream = Dish.watch([], { fullDocument: 'updateLookup' });

      changeStream.on('change', (changeEvent) => {
        const { operationType, fullDocument, documentKey } = changeEvent;
        console.log(`Change stream event: ${operationType}`);

        if (['insert', 'update', 'replace'].includes(operationType)) {
          io.emit('dish_update', {
            action: operationType,
            data: fullDocument
          });
        } else if (operationType === 'delete') {
          io.emit('dish_update', {
            action: 'delete',
            id: documentKey._id
          });
        }
      });

      changeStream.on('error', (err) => {
        console.error('Change stream subscription error:', err.message);
        changeStream.close();
        console.log('Re-establishing change stream in 5 seconds...');
        setTimeout(setupChangeStream, 5000);
      });

      console.log('MongoDB Change Stream observer registered.');
    } catch (error) {
      console.error('Failed to initialize Change Streams:', error.message);
      console.log('Retrying Change Stream initialization in 5 seconds...');
      setTimeout(setupChangeStream, 5000);
    }
  };

  setupChangeStream();

  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

initApp();

// Force nodemon restart to load updated .env variables

