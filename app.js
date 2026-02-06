import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// (async () => {
//     const db = await connectDB();
// })();

import authRouter from "./routes/auth.js";
import postRoute from "./routes/post.js";
import followRoute from "./routes/follow.js";
import messageRouter from "./routes/message.js";
import { dashbord, profile, logout } from "./controllers/main.controler.js";
import { islogin } from "./middleware/islogin.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        credentials: true,
    },
});

export { io };
let ids = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.VITE_API_URL, credentials: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("public/uploads"));
app.set("view engine", "ejs");

app.use("/api/auth", authRouter);
app.use("/api/post", islogin, postRoute);
app.use("/api/follow", islogin, followRoute);
app.use("/api/message", islogin, messageRouter);
app.get("/api/profile", islogin, profile);
app.get("/api/logout", islogin, logout);
app.get("/", islogin, dashbord);

io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return;

    console.log("connected:", userId, socket.id);

    ids[userId] = socket.id;

    io.emit("online:list", { onlineUsers: Object.keys(ids) });

    socket.on("sendMessage", (data) => {
        console.log("📩 sendMessage RECEIVED:", data);

        const to = String(data.to);
        console.log("➡️ SEND TO:", to, "AVAILABLE:", Object.keys(ids));

        if (ids[to]) {
            io.to(ids[to]).emit("recieveMessage", data);
            console.log("✅ EMITTED TO:", ids[to]);
        } else {
            console.log("❌ USER OFFLINE:", to);
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", userId);
        delete ids[userId];
        io.emit("online:list", { onlineUsers: Object.keys(ids) });
    });
});

server.listen(PORT, () => {
    console.log(`server start at http://localhost:${PORT}`);
});