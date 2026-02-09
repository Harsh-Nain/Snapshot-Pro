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
        origin: [
            "http://localhost:5173",
            "https://snapshot-frontend.onrender.com",
            "https://snapshot-fruntend.vercel.app/"
        ],
        credentials: true,
    },
});

export { io };
let ids = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
    "http://localhost:5173",
    "https://snapshot-frontend.onrender.com",
    "https://snapshot-fruntend.vercel.app/"

];

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://snapshot-frontend.onrender.com");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("public/uploads"));
app.set("view engine", "ejs");

app.get("/", islogin, dashbord);
app.get("/api/profile", islogin, profile);
app.use("/api/post", islogin, postRoute);
app.use("/api/follow", islogin, followRoute);
app.use("/api/message", islogin, messageRouter);
app.use("/api/auth", authRouter);
app.get("/api/logout", islogin, logout);

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
    console.log(`Server running on port ${PORT}`);
});
