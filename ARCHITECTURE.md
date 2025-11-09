 1. System Overview

This project is a real-time collaborative whiteboard where multiple users can draw simultaneously on a shared HTML5 canvas.
The synchronization is achieved through WebSockets (Socket.io) for low-latency bidirectional communication between the server and all connected clients.

The core challenges solved include:

Real-time synchronization of drawing strokes across users

Global undo/redo with synchronized canvas state

Managing eraser operations and clearing actions across users

Maintaining performance even under frequent updates

2. Data Flow Diagram
Event Flow:
+-------------+          +----------------+          +---------------+
|   Browser A | <------> |   Node.js +    | <------> |   Browser B   |
| (Canvas UI) |          |   Socket.io    |          | (Canvas UI)   |
+-------------+          +----------------+          +---------------+
       |                         |                          |
       |   Draw Stroke Event     |                          |
       |------------------------>|                          |
       |                         | Broadcast draw event     |
       |                         |------------------------->|
       |                         |                          |
       |     Canvas Updates      | <--- Undo/Redo/Sync ---->|

       Step-by-step Flow

User starts drawing → client emits start event with position & ID.

As the user moves → client emits draw events containing line segment data.

Server receives draw → broadcasts it to all connected users.

Other clients render the stroke immediately for real-time sync.

When a user performs Undo/Redo, their canvas state (as a DataURL image) is sent via canvasUpdate and synced globally.

On clear event, all canvases reset simultaneously.
WebSocket Protocol
Event Types & Payloads
Event	Direction	Description	Example Payload
connection	Server → Client	Acknowledges a new connection	{ userId: "socket123" }
init	Server → Client	Sends full stroke history on join	[ {x1, y1, x2, y2, color, strokeWidth} ]
start	Client → Server → Broadcast	Marks beginning of a new stroke	{ userId, x, y }
draw	Client → Server → Broadcast	Sends line segments while drawing	{ userId, x1, y1, x2, y2, color, strokeWidth, tool }
clear	Client → Server → All	Clears all canvases	{ }
canvasUpdate	Client → Server → All	Synchronizes full canvas state (Undo/Redo)	{ image: <base64 string> }
disconnect	Server → All	Announces a user leaving	{ userId }
♻️ 4. Undo/Redo Strategy

Undo/Redo is handled using canvas snapshots (DataURLs) stored locally on each client.

Client-side Stacks

undoStack stores up to 20 previous canvas states.

redoStack temporarily stores undone states for reapplication.

Synchronization

Each Undo/Redo emits a canvasUpdate event with the entire canvas as a base64 image.

All connected clients receive and re-render that image to maintain global consistency.

⚡ 5. Performance Decisions
Optimization	Reason
Normalized coordinates (0–1)	Ensures consistent scaling across varying canvas sizes.
Local drawing prediction	Each client draws instantly before network confirmation for a smooth UX.
Path segments instead of per-pixel updates	Reduces WebSocket event frequency dramatically.
Canvas snapshots limited to 20	Prevents excessive memory usage for Undo/Redo.
Eraser uses destination-out composite mode	True pixel erasure without extra redraws or fill layers.
⚔️ 6. Conflict Resolution
Simultaneous Drawing

Each user’s strokes are isolated using their socket.id.
Even if two users draw at the same coordinates simultaneously:

The canvas blends both paths naturally due to sequential rendering.

The system doesn’t lock regions — real-time collaboration is prioritized over strict consistency.

Undo/Redo Conflicts

If two users undo simultaneously:

The latest canvasUpdate event wins (last snapshot applied).

Clients always render the most recent broadcast to maintain uniform state.

This simple “last-writer-wins” approach ensures predictable user experience without complex merges.

🧱 7. System Architecture Diagram
             ┌─────────────────────────────┐
             │         Browser UI          │
             │  - Canvas (HTML5)           │
             │  - Toolbar (Brush/Eraser)   │
             │  - Undo/Redo Controls       │
             └──────────┬──────────────────┘
                        │ WebSocket Events
                        ▼
             ┌─────────────────────────────┐
             │       Socket.io Server       │
             │  - Receives draw/start/clear │
             │  - Broadcasts to all clients │
             │  - Manages connection state  │
             └──────────┬──────────────────┘
                        │ Broadcast
                        ▼
             ┌─────────────────────────────┐
             │     Other Clients (xN)      │
             │  - Render live strokes       │
             │  - Apply undo/redo updates   │
             └─────────────────────────────┘

🧩 8. Key Architectural Decisions
Component	Technology	Reason
Frontend	Vanilla JS + Canvas API	Demonstrates low-level DOM and Canvas handling
Backend	Node.js + Socket.io	Easy real-time communication and scalability
No Database	Real-time transient data; no persistence required	
Undo/Redo	DataURL snapshots	Simplifies synchronization
Eraser	destination-out mode	True pixel removal for smooth erasing
State Sharing	Socket Broadcasts	Keeps all clients in sync without polling


🚀 9. Scalability Discussion

For handling 1000+ concurrent users:

Replace the in-memory drawing-state.js with a Redis Pub/Sub system.

Introduce namespaced rooms (io.of('/room')) for segmented canvases.

Use a Load Balancer + Sticky Sessions to distribute WebSocket connections.

Optionally persist stroke deltas in MongoDB or S3 for replay and versioning.