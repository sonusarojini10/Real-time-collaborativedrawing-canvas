 1️⃣ Data Flow Diagram (High-level)
[Pointer / Mouse Events]
     │
     ▼
Client (HTML5 Canvas)
  • Capture pointer movements  
  • Smooth + downsample stroke points  
  • Draw locally (client-side prediction)  
  • Stream stroke data via WebSocket  
     │
     ▼
Server (Authoritative State)
  • Handle start/draw/clear events  
  • Maintain ordered global stroke history  
  • Broadcast updates to all connected clients  
  • Synchronize undo/redo (global consistency)  
     │
     ▼
All Clients
  • Receive broadcasted stroke data  
  • Update local canvas immediately  
  • Re-render canvas deterministically  
  • Keep history synced across all users

2️⃣ WebSocket Protocol (Socket.IO Events)
Client → Server
Event	Description	Example Payload
start	Begin a new stroke	{ userId, x, y }
draw	Append stroke segment	{ userId, x1, y1, x2, y2, color, strokeWidth, tool }
clear	Clear canvas for all	{ }
canvasUpdate	Send full canvas snapshot (undo/redo)	{ image: <base64> }
Server → Client
Event	Description	Example Payload
init	Send full stroke history on join	[ {x1,y1,x2,y2,color,strokeWidth} ]
draw	Broadcast live stroke segment	{ userId, x1, y1, x2, y2, color, strokeWidth, tool }
clear	Notify all clients to clear	{ }
canvasUpdate	Sync undo/redo states globally	{ image: <base64> }
Protocol Highlights

Coordinates are normalized (0–1) for consistent scaling across devices.

destination-out is used for eraser mode (true pixel-level erasing).

Undo/Redo and clear actions are synchronized by broadcasting base64 canvas snapshots.

The system follows a broadcast-only design — no peer-to-peer connections.

3️⃣ Undo/Redo Strategy (Global)
Concept	Implementation
Local History	Each client keeps undoStack and redoStack (max 20 snapshots).
Snapshot Format	Each state is a DataURL of the canvas image.
Undo	Pops the last canvas snapshot, restores previous image, emits canvasUpdate.
Redo	Pushes forward from redoStack, restores image, emits canvasUpdate.
Synchronization	The server rebroadcasts the updated canvas image to all clients for consistency.
Global State	All connected users always share the same visual state (last writer wins).

Flow Example:

User A clicks Undo →
Removes local snapshot →
Emits canvasUpdate →
Server broadcasts new image →
All clients restore same snapshot

4️⃣ Performance Decisions
Optimization	Description
Normalized Coordinates (0–1)	Keeps drawings aligned across all screen sizes and resolutions.
Client-side Prediction	User sees immediate strokes while network syncs in the background.
Batching Stroke Data	Reduces WebSocket message frequency and prevents jitter.
Canvas Snapshot Limit (20)	Prevents memory bloat while maintaining undo depth.
destination-out Eraser	Removes pixels efficiently instead of repainting white.
Efficient Re-render	Canvas clears and redraws only changed areas during updates.
No External Drawing Libraries	Ensures full control over performance and behavior.
5️⃣ Conflict Resolution
Scenario	Resolution
Two users draw simultaneously	Both strokes are drawn — stroke order defines final render.
Undo/Redo conflict	The latest canvasUpdate event overwrites previous state (last-write-wins).
Eraser Overlap	destination-out ensures deterministic erasure across clients.
Late Joiners	Receive full canvas snapshot (init) and render immediately.
6️⃣ Edge Cases & Handling
Case	Handling Strategy
Late Joiners	Server emits full stroke history (init) upon connection.
Network Drop	Socket.io auto-reconnects; last canvasUpdate re-syncs full state.
Resize Events	Canvas resizes responsively; strokes scaled consistently (normalized coordinates).
Undo After Clear	Clear action is stored as a snapshot, so Undo restores previous canvas.
Dropped Frames	Minor packet loss tolerated since next stroke/redo event re-synchronizes the state.
7️⃣ Architectural Summary Diagram
 ┌──────────────────────────────┐
 │         Client (A)           │
 │  - Canvas Drawing             │
 │  - Undo/Redo Stack            │
 │  - Color, Brush, Eraser Tools │
 └──────────────┬───────────────┘
                │  WebSocket
                ▼
 ┌──────────────────────────────┐
 │        Node.js Server        │
 │  - Socket.io Event Hub       │
 │  - History & Sync Logic      │
 │  - Global Undo/Redo Control  │
 └──────────────┬───────────────┘
                │ Broadcast
                ▼
 ┌──────────────────────────────┐
 │         Client (B, C...)     │
 │  - Mirror Real-time Updates  │
 │  - Render Canvas in Sync     │
 │  - Handle Global Actions     │
 └──────────────────────────────┘