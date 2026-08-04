import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = (async () => {
      const uri = process.env.MONGODB_URI?.trim();

      let m: typeof mongoose;
      if (uri && uri.startsWith("mongodb+srv://")) {
        console.log("Connecting to remote MongoDB Atlas cluster...");
        m = await mongoose.connect(uri, opts);
      } else {
        console.log("Initializing MongoDB In-Memory Server for local development...");
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        m = await mongoose.connect(memoryUri, opts);
      }

      // Ensure connection is fully open before resolving
      if (m.connection.readyState !== 1) {
        await new Promise((resolve) => m.connection.once("open", resolve));
      }

      return m;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function getMongoDb() {
  await connectToDatabase();
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection not initialized");
  }
  return mongoose.connection.db;
}
