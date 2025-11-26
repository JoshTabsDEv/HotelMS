import { getAuthSession } from "./auth-utils";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireAuth();
  if (error) {
    return { error, session: null };
  }

  if (session?.user?.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

