import NextAuth from "next-auth";
import { authOptions } from "./auth";

// Create NextAuth instance and export auth function
// This is separate from the route handler to avoid Next.js route export restrictions
export const { auth, handlers } = NextAuth(authOptions);

