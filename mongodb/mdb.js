// import { MongoClient } from "mongodb";
// import dotenv from "dotenv";

// dotenv.config();

// const uri = process.env.MONGO_URI;
// let db;
// let client;

// export const connectDB = async () => {
//     if (db) return db;

//     client = new MongoClient(uri);
//     console.log('ok');
//     await client.connect();
//     db = client.db("messanger");
//     console.log("MongoDB Connected");
//     return db;
// };