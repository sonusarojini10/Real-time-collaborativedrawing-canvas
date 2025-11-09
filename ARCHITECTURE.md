 1️. Data Flow Diagram (High-level)

 ```text
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
  ```

2️. WebSocket Protocol (Socket.IO Events)
```text
Client → Server
──────────────────────
start         Begin stroke
draw          Append stroke data
clear         Clear canvas
canvasUpdate  Send undo/redo snapshot

Server → Client
──────────────────────
init          Send full history
draw          Broadcast stroke
clear         Sync clear for all
canvasUpdate  Sync undo/redo
```



3️. Undo/Redo Strategy (Global)
```text
• Each client maintains undoStack[] & redoStack[]
• On draw → save snapshot (DataURL)
• Undo → pop, push to redoStack, restore previous
• Redo → pop redoStack, restore next
• Server rebroadcasts updates for all users
```

Flow Example:

User A clicks Undo → Removes local snapshot → Emits canvasUpdate → Server broadcasts new image →
All clients restore same snapshot

4️. Performance Decisions
```text
• Normalized (0–1) coordinates → consistent scaling
• Downsampled points for efficiency
• Client-side prediction for low latency
• Eraser uses "destination-out" blending
• Undo stack limited to 20 snapshots
• Broadcast only incremental updates
```
5️. Conflict Resolution
```text
• Simultaneous strokes resolved by order
• Eraser removes pixels (non-destructive blending)
• Undo/Redo synced globally (last-write-wins)
• Late joiners receive full canvas snapshot
```
6️. Edge Cases & Handling
```text
• Late joiners get complete history on init. 
• Socket auto-reconnect on network loss.
• Canvas auto-rescales on window resize.
• Undo works after clear (treated as snapshot).
```
