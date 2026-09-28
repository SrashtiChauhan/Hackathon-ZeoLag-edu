import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { registerRoomHandlers } from "./socket/roomHandlers";
import { registerSignalingHandlers } from "./socket/signalingHandlers";
import { checkRedisConnection } from "./services/redisService";

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// HTTP server
const httpServer = http.createServer(app);

// Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    const redisStatus = await checkRedisConnection();

    res.json({
      status: "ok",
      service: "NexusStream RTC Signaling Server",
      redis: redisStatus === "PONG" ? "connected" : redisStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      service: "NexusStream RTC Signaling Server",
      redis: "disconnected",
    });
  }
});

// Socket connection
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Room management
  registerRoomHandlers(io, socket);

  // WebRTC signaling
  registerSignalingHandlers(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket disconnected: ${socket.id} | Reason: ${reason}`
    );
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 NexusStream signaling server running`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});