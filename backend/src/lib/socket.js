// backend/lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const ADMIN_USER_ID = "682e7db87b82ee0c1d2a99a4";

const SOCKET_IO_ORIGIN =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: SOCKET_IO_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  if (userId === ADMIN_USER_ID) {
    socket.broadcast.emit("adminOnlineToast", {
      message: "Say Hi to Our Admin!",
    });
    console.log("Admin user connected. Emitting toast event to other users.");
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
