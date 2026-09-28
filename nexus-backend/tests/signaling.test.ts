import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "test-room-123";

const clientA = io(SERVER_URL);
const clientB = io(SERVER_URL);

clientA.on("connect", () => {
  console.log("CLIENT A connected:", clientA.id);

  clientA.emit("join-room", ROOM_ID, "user-A");
});

clientB.on("connect", () => {
  console.log("CLIENT B connected:", clientB.id);

  clientB.emit("join-room", ROOM_ID, "user-B");
});

clientA.on("room-joined", (data) => {
  console.log("CLIENT A joined:", data);
});

clientB.on("room-joined", (data) => {
  console.log("CLIENT B joined:", data);
});

clientA.on("user-joined", (data) => {
  console.log("CLIENT A received user-joined:", data);

  // Send a dummy signaling message from A → B
  clientA.emit("signal", {
    targetSocketId: data.socketId,
    data: {
      type: "test-message",
      message: "Hello from Client A",
    },
  });
});

clientB.on("signal-relay", (data) => {
  console.log("CLIENT B received signal:", data);

  // Close both clients after successful signaling
  clientA.disconnect();
  clientB.disconnect();
});

clientA.on("disconnect", (reason) => {
  console.log("CLIENT A disconnected:", reason);
});

clientB.on("disconnect", (reason) => {
  console.log("CLIENT B disconnected:", reason);
});