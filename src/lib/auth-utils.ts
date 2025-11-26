import { auth } from "./auth-instance";

/**
 * Get the current session on the server side
 * Use this in API routes and server components
 * For NextAuth v5, we use the auth function from the auth instance
 */
export async function getAuthSession() {
  return await auth();
}

