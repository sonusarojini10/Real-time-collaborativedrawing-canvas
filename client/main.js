window.onload = () => {
  // Initialize the canvas when the page loads
  initCanvas();

  // 🎨 Color picker
  document.getElementById("colorPicker").oninput = (e) => {
    setColor(e.target.value);
  };

  // ✏️ Stroke width
  document.getElementById("strokeWidth").oninput = (e) => {
    setStrokeWidth(e.target.value);
  };

  // 🧽 Clear canvas button
  document.getElementById("clearBtn").onclick = () => {
    clearCanvas();
    socket.emit("clear");
    socket.emit("canvasUpdate", { image: canvas.toDataURL("image/png") });
  };

  // ↩️ Undo button
  document.getElementById("undoBtn").onclick = () => {
    undo();
  };

  // ↪️ Redo button
  document.getElementById("redoBtn").onclick = () => {
    redo();
  };
};
document.getElementById("tool").onchange = (e) => {
  setTool(e.target.value);
};
