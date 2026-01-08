import { relations } from "drizzle-orm";
import { users, posts, postLikes, postComments, follows, followRequests, messages, } from "./schems";

export const userRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    likes: many(postLikes),
    comments: many(postComments),
    followers: many(follows),
    followRequests: many(followRequests),
    sentMessages: many(messages),
}));

export const postRelations = relations(posts, ({ many }) => ({
    likes: many(postLikes),
    comments: many(postComments),
}));

export const messageRelations = relations(messages, ({ one }) => ({
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    receiver: one(users, {
        fields: [messages.receiverId],
        references: [users.id],
    }),
}));