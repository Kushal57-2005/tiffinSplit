import { auth } from "./auth";
import { connectToDatabase, getMongoDb } from "./db";

export async function getOrCreateDefaultOwner(request?: Request) {
  await connectToDatabase();
  const db = await getMongoDb();

  if (request) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session?.user?.id) {
        const userId = session.user.id;
        let dbUser = await db.collection("user").findOne({ _id: userId as any });
        if (!dbUser && session.user.email) {
          dbUser = await db.collection("user").findOne({ email: session.user.email });
        }

        return {
          id: userId,
          name: session.user.name || dbUser?.name || "User",
          email: session.user.email || dbUser?.email || "",
          phone: dbUser?.phone || "",
          upiId: dbUser?.upiId || "",
        };
      }
    } catch (err) {
      console.warn("Session retrieval in getOrCreateDefaultOwner warning:", err);
    }
  }

  // Fallback for default primary owner dataset if unauthenticated
  let user = await db.collection("user").findOne({ email: "kushalwaykole57@gmail.com" });
  if (!user) {
    user = await db.collection("user").findOne({});
  }

  const defaultOwnerId = user?._id ? user._id.toString() : "6a7240e262826c190cf1f011";

  return {
    id: defaultOwnerId,
    name: user?.name || "Kushal Waykole",
    email: user?.email || "kushalwaykole57@gmail.com",
    phone: user?.phone || "",
    upiId: user?.upiId || "",
  };
}
