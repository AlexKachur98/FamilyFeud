import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { joinGameSession, leaveGameSession } from "./gameSession.socket.js";

export default function initWebsocket(listeningPort) {
    const io = new Server();
    io.on("connection", (socket) => {
        console.log("User connected to websocket:", socket.id);

        joinGameSession( socket );
        leaveGameSession( socket );
    });

    const ioCorsOptions = {
        cors: {
            origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
        }
    };

    // Attach WebSocket server
    io.attach(listeningPort, ioCorsOptions);

    instrument(io, {
        auth: {
            type: "basic",
            username: process.env.ADMIN_SOCKET_UI_USERNAME,
            password: process.env.ADMIN_SOCKET_UI_PASSWORD,
        }
    });
}