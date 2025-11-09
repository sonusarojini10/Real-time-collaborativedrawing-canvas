let tool = "brush";
let canvas, ctx;
let drawing = false;
let color = "#000000";
let strokeWidth = 3;
let lastX = 0, lastY = 0;

// 🟢 NEW: Undo/Redo stacks
let undoStack = [];
let redoStack = [];
let didDrawThisStroke = false;

function initCanvas() {
  canvas = document.getElementById("drawingCanvas");
  ctx = canvas.getContext("2d");
  resizeCanvas();
  canvas.style.userSelect = "none";

  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseout", endDraw);

  // 🟢 Save initial blank canvas state
  saveCanvasState();
}

function resizeCanvas() {
  const offsetTop = canvas.getBoundingClientRect().top;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - offsetTop;
}

// 🟢 Save the current canvas image as a DataURL snapshot
function saveCanvasState() {
  if (undoStack.length >= 20) undoStack.shift(); // limit to 20 for performance
  undoStack.push(canvas.toDataURL("image/png"));
  redoStack = []; // clear redo history on new draw
}

// 🟢 Restore a saved snapshot
function restoreCanvasFromDataURL(dataUrl) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

// 🟢 Undo last action
function undo() {
  if (undoStack.length < 2) return;
  const current = undoStack.pop(); // remove current
  redoStack.push(current); // store for redo
  const previous = undoStack[undoStack.length - 1];
  restoreCanvasFromDataURL(previous);
  socket.emit("canvasUpdate", { image: previous });
}

// 🟢 Redo undone action
function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  restoreCanvasFromDataURL(next);
    socket.emit("canvasUpdate", { image: next });
}

function startDraw(e) {
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
  drawing = true;
  didDrawThisStroke = false; // 🟢 reset stroke flag

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);

  // tell others that a stroke starts here
  socket.emit("start", {
    userId: socket.id,
    x: lastX / canvas.width,
    y: lastY / canvas.height,
  });
}

function draw(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const newX = e.clientX - rect.left;
  const newY = e.clientY - rect.top;

  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

// Handle brush vs eraser
if (tool === "eraser") {
  ctx.globalCompositeOperation = "destination-out"; // erase pixels
  ctx.strokeStyle = "rgba(0,0,0,1)"; // color doesn't matter
} else {
  ctx.globalCompositeOperation = "source-over"; // normal draw mode
  ctx.strokeStyle = color;
}


  ctx.lineTo(newX, newY);
  ctx.stroke();

  didDrawThisStroke = true; // 🟢 we actually drew something

  socket.emit("draw", {
    userId: socket.id,
    x1: lastX / canvas.width,
    y1: lastY / canvas.height,
    x2: newX / canvas.width,
    y2: newY / canvas.height,
    color,
    strokeWidth,
    tool,
  });

  [lastX, lastY] = [newX, newY];
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();

  // 🟢 Save new state only if something was drawn
  if (didDrawThisStroke) {
    saveCanvasState();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveCanvasState(); // 🟢 allow undo after clear
}

function setColor(newColor) {
  color = newColor;
}

function setStrokeWidth(w) {
  strokeWidth = w;
}

function setTool(newTool) {
  tool = newTool;
}

