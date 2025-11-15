const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { addStroke, getAllStrokes } = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:["https://real-time-collaborativedrawing-canv.vercel.app"], // you can tighten this later if needed
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.emit("init", getAllStrokes());

  // 🟢 New: when a user starts drawing
  socket.on("start", (data) => {
    socket.broadcast.emit("start", data);
  });

  // 🟢 Normal draw event
  socket.on("draw", (data) => {
    addStroke(data);
    socket.broadcast.emit("draw", data);
  });

  // 🟢 Clear event
  socket.on("clear", () => {
    io.emit("clear");
  });
  socket.on("canvasUpdate", (payload) => {
  socket.broadcast.emit("canvasUpdate", payload);
});

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

setInterval(() => {
  io.emit("pingCheck", { time: Date.now() });
}, 25000); // keep socket active

