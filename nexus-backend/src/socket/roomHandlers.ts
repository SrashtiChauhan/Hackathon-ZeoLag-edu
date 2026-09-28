import { Server, Socket } from "socket.io";
import {
  addSocketToRoom,
  removeSocketFromRoom,
  getRoomCount,
  deleteRoom,
} from "../services/redisService";

export function registerRoomHandlers(
  io: Server,
  socket: Socket
): void {
  socket.on(
    "join-room",
    async (roomId: string, userId: string) => {
      try {
        if (!roomId || !userId) {
          socket.emit("error-message", {
            message: "roomId and userId are required",
          });
          return;
        }

        // Join Socket.io room
        await socket.join(roomId);

        // Add socket to Redis
        await addSocketToRoom(roomId, socket.id);

        // Get current participant count
        const participantCount = await getRoomCount(roomId);

        // Tell the joining user that they successfully joined
        socket.emit("room-joined", {
          roomId,
          userId,
          socketId: socket.id,
          participantCount,
        });

        // Notify everyone else in the room
        socket.to(roomId).emit("user-joined", {
          userId,
          socketId: socket.id,
        });

        console.log(
          `User ${userId} joined room ${roomId}. Participants: ${participantCount}`
        );
      } catch (error) {
        console.error("Join room error:", error);

        socket.emit("error-message", {
          message: "Failed to join room",
        });
      }
    }
  );

  socket.on("disconnecting", async () => {
    try {
      // Socket.io gives us the rooms before the socket is disconnected
      const rooms = Array.from(socket.rooms).filter(
        (room) => room !== socket.id
      );

      for (const roomId of rooms) {
        await removeSocketFromRoom(roomId, socket.id);

        const participantCount = await getRoomCount(roomId);

        // Notify remaining users
        socket.to(roomId).emit("user-left", {
          socketId: socket.id,
        });

        // Ephemeral room cleanup
        if (participantCount === 0) {
          await deleteRoom(roomId);

          console.log(
            `Room ${roomId} is empty. Redis room deleted.`
          );
        }
      }
    } catch (error) {
      console.error("Disconnect cleanup error:", error);
    }
  });
}