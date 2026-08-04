import { connectToDatabase, getMongoDb } from "./db";

export async function getOrCreateDefaultOwner() {
  await connectToDatabase();
  const db = await getMongoDb();

  let user = await db.collection("user").findOne({ email: "kushalwaykole57@gmail.com" });
  if (!user) {
    user = await db.collection("user").findOne({});
  }

  // Use the owner ID associated with the primary dataset
  const ownerId = "6a7240e262826c190cf1f011";

  return {
    id: ownerId,
    name: user?.name || "Kushal Waykole",
    email: user?.email || "kushalwaykole57@gmail.com",
    phone: user?.phone || "",
    upiId: user?.upiId || "",
  };
}
