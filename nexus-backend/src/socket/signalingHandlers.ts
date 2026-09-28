import { Server, Socket } from "socket.io";

export function registerSignalingHandlers(
  io: Server,
  socket: Socket
): void {
  socket.on(
    "signal",
    ({
      targetSocketId,
      data,
    }: {
      targetSocketId: string;
      data: unknown;
    }) => {
      if (!targetSocketId || !data) {
        socket.emit("error-message", {
          message: "targetSocketId and data are required",
        });
        return;
      }

      io.to(targetSocketId).emit("signal-relay", {
        senderSocketId: socket.id,
        data,
      });
    }
  );
}