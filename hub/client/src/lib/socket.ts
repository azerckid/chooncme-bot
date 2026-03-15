import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://140.245.69.42.nip.io";

class SocketService {
    private static instance: Socket | null = null;

    public static getInstance(): Socket {
        if (!SocketService.instance) {
            SocketService.instance = io(SOCKET_URL, {
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                autoConnect: false, // 필요할 때 수동으로 연결하기 위해 false로 설정
                transports: ["websocket"], // 🚀 웹소켓 전용 모드
                secure: true,              // 🔒 SSL 사용 명시
            });

            SocketService.instance.on("connect", () => {
                console.log("Connected to Socket.io server");
            });

            SocketService.instance.on("disconnect", (reason) => {
                console.log(`Disconnected from server: ${reason}`);
            });
        }

        return SocketService.instance;
    }
}

export const socket = SocketService.getInstance();
