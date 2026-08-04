import { connectToDatabase } from "./db";
import { UserModel } from "@/models";

export async function getOrCreateDefaultOwner() {
  await connectToDatabase();

  const defaultEmail = "admin@tiffinsplit.local";

  let owner = await UserModel.findOne({ email: defaultEmail });

  if (!owner) {
    owner = await UserModel.create({
      name: "Tiffin Admin Owner",
      email: defaultEmail,
    });
  }

  return {
    id: owner._id.toString(),
    name: owner.name,
    email: owner.email,
  };
}
