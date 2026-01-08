import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

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
        origin: "*",
    },
});

let ids = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("public/uploads"));
app.set("view engine", "ejs");

app.use("/auth", authRouter);
app.use("/post", islogin, postRoute);
app.use("/follow", islogin, followRoute);
app.use("/message", islogin, messageRouter);
app.get("/profile", islogin, profile);
app.get("/logout", islogin, logout);
app.get("/", islogin, dashbord);

io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    console.log('userId', userId, socket.id);

    ids[userId] = socket.id;

    socket.broadcast.emit("user-online", {
        userId,
    });

    socket.on("event", (data) => {
        console.log(data, ids[data.to]);

        if (ids[data.to]) {
            io.to(ids[data.to]).emit("event", data);
        }
    });

    socket.on("message", (data) => {
        console.log(data, ids[data.to]);

        if (ids[data.to]) {
            io.to(ids[data.to]).emit("message", data);
        }
    });

});


if (process.env.MODE == "PROD") {
    server.listen(PORT, '0.0.0.0', () => {
        console.log('server start at http://0.0.0.0:', PORT);
    });
} else {
    server.listen(PORT, () => {
        console.log('server start at http://127.0.0.1:', PORT);
    });
}


























// let obj = {
//     id: 1,
//     user: {
//         profile: {
//             name: "name"
//         }
//     }
// }

// function f(obj, currentPath = "", result = {}) {

//     for (const key in obj) {
//         if (typeof obj[key] == "object" && !Array.isArray(obj[key])) {
//             if (currentPath == "") {
//                 currentPath += `${key}`
//             } else {
//                 currentPath += `.${key}`
//             }
//             f(obj[key], currentPath, result)
//         } else {
//             if (currentPath == "") {
//                 result[key] = obj[key]
//             } else {
//                 currentPath += `.${key}`
//                 result[currentPath] = obj[key]
//                 currentPath = ""
//             }
//         }
//     }
//     return result
// }

// let d = f(obj)
// console.log(d);