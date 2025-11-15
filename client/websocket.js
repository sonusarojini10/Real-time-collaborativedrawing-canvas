const socket = io("https://real-time-collaborativedrawing-canvas-2.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
   reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});

const remoteUsers = {};

// 🟢 When another user starts a stroke
socket.on("start", (data) => {
  // Convert normalized coordinates (0–1) back to pixel values
  remoteUsers[data.userId] = {
    lastX: data.x * canvas.width,
    lastY: data.y * canvas.height,
  };
});

// 🟢 When another user draws
socket.on("draw", (data) => {
  const user = remoteUsers[data.userId] || {
    lastX: data.x1 * canvas.width,
    lastY: data.y1 * canvas.height,
  };
   if (data.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out"; // actually erase pixels
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over"; // normal draw mode
    ctx.strokeStyle = data.color;
  }

  
  ctx.lineWidth = data.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(user.lastX, user.lastY);
  ctx.lineTo(data.x2 * canvas.width, data.y2 * canvas.height);
  ctx.stroke();
  ctx.closePath();

  ctx.globalCompositeOperation = "source-over";

  remoteUsers[data.userId] = {
    lastX: data.x2 * canvas.width,
    lastY: data.y2 * canvas.height,
  };
});

// 🟢 Clear event
socket.on("clear", () => {
  clearCanvas();
  Object.keys(remoteUsers).forEach((id) => delete remoteUsers[id]);
});

// 🟢 Connection info
socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

// 🟢 Helper to send draw data from canvas.js
function sendDrawData(data) {
  socket.emit("draw", data);
}
socket.on("canvasUpdate", ({ image }) => {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = image;
});
socket.on("pingCheck", (data) => {
  console.log("Server alive:", new Date(data.time).toLocaleTimeString());
});

