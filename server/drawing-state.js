const drawingHistory = [];

function addStroke(data) {
  drawingHistory.push(data);
}

function undo() {
  drawingHistory.pop();
}

function getAllStrokes() {
  return drawingHistory;
}

module.exports = { addStroke, undo, getAllStrokes };
