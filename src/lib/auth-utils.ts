import { auth } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the current session on the server side
 * Use this in API routes and server components
 * For NextAuth v5, we use the auth function exported from the route handler
 */
export async function getAuthSession() {
  return await auth();
}

