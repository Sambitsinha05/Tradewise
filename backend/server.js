import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import { startSnapshotCron } from './services/snapshotService.js';
import marketSocket from './socket/marketSocket.js';
import portfolioSocket from './socket/portfolioSocket.js';
import { startAlertMonitoring } from './socket/alertSocket.js';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initialize socket modules
  marketSocket(io, socket);
  portfolioSocket(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Attach socket io to global context so we can use it in controllers
app.set('io', io);

// Start background CRON jobs
startSnapshotCron();
startAlertMonitoring(io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
