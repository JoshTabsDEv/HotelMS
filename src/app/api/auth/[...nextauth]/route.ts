import { handlers } from "@/lib/auth-instance";

// Export only HTTP handlers (Next.js route restriction)
export const { GET, POST } = handlers;

