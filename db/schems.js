import { mysqlTable, int, varchar, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable(
    "user",
    {
        Id: int("Id").primaryKey().autoincrement(),
        Username: varchar("Username", { length: 20 }),
        First_name: varchar("First_name", { length: 20 }),
        Last_name: varchar("Last_name", { length: 20 }).notNull(),
        Email: varchar("Email", { length: 30 }).notNull(),
        PASSWORD: text("PASSWORD").notNull(),
        image_src: text("image_src").notNull(),
        bio: varchar("bio", { length: 255 }),
    },
    (table) => ({
        emailIdx: uniqueIndex("Email").on(table.Email),
        usernameIdx: uniqueIndex("Username").on(table.Username),
    })
);

export const posts = mysqlTable("post", {
    Id: int("Id").primaryKey().autoincrement(),
    userId: int("userId").notNull(),
    postName: varchar("postName", { length: 255 }),
    desc: text("desc"),
    image_url: text("image_url"),
    songUrl: text("songUrl").default(""),
    isPublic: boolean("isPublic").default(true),
    created_at: timestamp("created_at").defaultNow(),
    Likes: int("Likes").default(0),
});

export const postLikes = mysqlTable("post_like", {
    Id: int("Id").primaryKey().autoincrement(),
    userId: int("userId").notNull(),
    postId: int("postId").notNull(),
    Likes: int("Likes").default(0),
});

export const postComments = mysqlTable("post_comment", {
    Id: int("Id").primaryKey().autoincrement(),
    userId: int("userId").notNull(),
    postId: int("postId").notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at").defaultNow(),
});

export const follows = mysqlTable("follow", {
    Id: int("Id").primaryKey().autoincrement(),
    userId: int("userId").notNull(),
    followingId: int("followingId").notNull(),
});

export const followRequests = mysqlTable("follow_request", {
    Id: int("Id").primaryKey().autoincrement(),
    userId: int("userId").notNull(),
    requestId: int("requestId").notNull(),
    request: boolean("request").default(false),
});

export const messages = mysqlTable("message", {
    Id: int("Id").primaryKey().autoincrement(),
    senderId: int("senderId").notNull(),
    receiverId: int("receiverId").notNull(),
    message: text("message").notNull(),
    created_at: timestamp("created_at").defaultNow(),
});