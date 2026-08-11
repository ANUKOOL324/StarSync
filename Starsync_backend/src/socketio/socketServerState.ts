import type { SocketIoServer } from "./socketTypes";

let activeSocketIoServer: SocketIoServer | null = null;

export const setActiveSocketIoServer = (io: SocketIoServer) => {
  activeSocketIoServer = io;
};

export const getActiveSocketIoServer = (): SocketIoServer | null => {
  return activeSocketIoServer;
};
