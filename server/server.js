const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { addStroke, getAllStrokes } = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

server.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
