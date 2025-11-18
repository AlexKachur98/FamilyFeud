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

    const adminUiPassword = process.env.ADMIN_SOCKET_UI_PASSWORD;
    const adminUiUsername = process.env.ADMIN_SOCKET_UI_USERNAME;

    // Only enable the admin UI if a valid bcrypt hash is provided to avoid runtime crashes.
    if (adminUiPassword && adminUiPassword.startsWith("$2")) {
        instrument(io, {
            auth: {
                type: "basic",
                username: adminUiUsername,
                password: adminUiPassword,
            }
        });
    } else {
        console.warn("Socket.io admin UI disabled: ADMIN_SOCKET_UI_PASSWORD must be a bcrypt hash.");
    }
}
