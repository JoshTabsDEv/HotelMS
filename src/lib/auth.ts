import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getPool } from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  password: string | null;
  name: string | null;
  role: "admin" | "user";
  image: string | null;
};

type AccountRow = RowDataPacket & {
  id: number;
  user_id: number;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

type SessionRow = RowDataPacket & {
  id: number;
  session_token: string;
  user_id: number;
  expires: Date;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const pool = getPool();
        const [rows] = await pool.query<UserRow[]>(
          "SELECT id, email, password, name, role, image FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
          [credentials.email]
        );

        const user = rows[0];
        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const pool = getPool();
        
        // Check if user exists
        const [userRows] = await pool.query<UserRow[]>(
          "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
          [user.email]
        );

        if (userRows.length === 0) {
          // Create new user with 'user' role
          const [result] = await pool.execute<ResultSetHeader>(
            "INSERT INTO users (email, name, image, role) VALUES (?, ?, ?, 'user')",
            [user.email, user.name, user.image]
          );
          user.id = String(result.insertId);
          user.role = "user";
        } else {
          user.id = String(userRows[0].id);
          user.role = userRows[0].role;
        }

        // Save account
        if (account) {
          const [accountRows] = await pool.query<AccountRow[]>(
            "SELECT id FROM accounts WHERE provider = ? AND provider_account_id = ? LIMIT 1",
            [account.provider, account.providerAccountId]
          );

          if (accountRows.length === 0) {
            await pool.execute(
              `INSERT INTO accounts (
                user_id, type, provider, provider_account_id,
                refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                user.id,
                account.type,
                account.provider,
                account.providerAccountId,
                account.refresh_token || null,
                account.access_token || null,
                account.expires_at || null,
                account.token_type || null,
                account.scope || null,
                account.id_token || null,
                account.session_state || null,
              ]
            );
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "admin" | "user") || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export auth function for use in middleware and server components
// Note: This is a workaround for NextAuth v5 beta compatibility
export async function getAuth() {
  const { auth } = await import("next-auth");
  return auth(authOptions);
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "admin" | "user";
    };
  }

  interface User {
    role: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "user";
  }
}

