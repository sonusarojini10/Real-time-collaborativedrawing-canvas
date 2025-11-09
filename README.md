# 🎨 Real-Time Collaborative Drawing Canvas

## 🚀 Setup
```bash
npm install
npm start
```

Then open:
👉 http://localhost:3000

How to Test with Multiple Users
```text
1.Run the server (npm start).
2.Open two or more browser tabs/windows with the same URL.
3.Draw in one window — strokes appear instantly in all others.
4.Try changing colors, erasing, undo/redo, and clearing canvas.
```
Features
```text
Real-time drawing sync across users
Brush, eraser, color, and stroke width options
Global undo/redo
Clear canvas for all
Responsive and minimal UI
```
Known Limitations / Bugs
```text
1.Undo/Redo uses image snapshots (limited to 20 states).
2.No persistent storage (resets on refresh).
3.Minor lag under heavy network load.
```
Time Spent
```text
Task	Time
Core functionality	8 hrs
Undo/Redo & Eraser	3 hrs
UI & Responsiveness	2 hrs
Testing & Debugging	2 hrs
Documentation	1 hr
```
Total: ~16 hours