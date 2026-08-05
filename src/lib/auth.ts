import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoDb } from "./db";

const db = await getMongoDb();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://tiffinsplit.vercel.app",
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL || "https://tiffinsplit.vercel.app"}/api/auth/callback/google`,
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL || "https://tiffinsplit.vercel.app"}/api/auth/callback/github`,
      enabled: Boolean(process.env.GITHUB_CLIENT_ID),
    },
  },
});
