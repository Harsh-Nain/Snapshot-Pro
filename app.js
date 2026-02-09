import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import authRouter from "./routes/auth.js";
import postRoute from "./routes/post.js";
import followRoute from "./routes/follow.js";
import messageRouter from "./routes/message.js";
import { dashbord, profile, logout } from "./controllers/main.controler.js";
import { islogin } from "./middleware/islogin.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "https://snapshot-fruntend.vercel.app"
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
export { io };

let ids = {};

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
        }

        return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("public/uploads"));

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

    ids[userId] = socket.id;
    io.emit("online:list", { onlineUsers: Object.keys(ids) });

    socket.on("sendMessage", (data) => {
        const to = String(data.to);
        if (ids[to]) {
            io.to(ids[to]).emit("recieveMessage", data);
        }
    });

    socket.on("disconnect", () => {
        delete ids[userId];
        io.emit("online:list", { onlineUsers: Object.keys(ids) });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});