import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth v5 beta structure
const nextAuth = NextAuth(authOptions);

export const { handlers, auth } = nextAuth;
export const { GET, POST } = handlers;

