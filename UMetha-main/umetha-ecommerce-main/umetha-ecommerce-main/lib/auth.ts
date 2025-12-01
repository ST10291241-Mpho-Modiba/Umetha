// lib/auth.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import type { Adapter } from "next-auth/adapters";
import type { User as AdapterUser } from "next-auth";

// Mock database call (replace with your actual DB call)
const yourDatabaseCallToGetUserById = async (id: string) => {
  return {
    id,
    email: "user@example.com",
    name: "John Doe",
    role: "admin",
    emailVerified: null,
  };
};

// Custom Adapter
const myCustomAdapter: Adapter = {
  async getUser(id: string): Promise<AdapterUser | null> {
    const user = await yourDatabaseCallToGetUserById(id);
    if (!user) return null;
    return user as AdapterUser; // satisfies v4 Adapter type
  },

  async createUser(user: AdapterUser): Promise<AdapterUser> {
    return {
      ...user,
      id: user.id ?? "generated-id",
    };
  },

  async updateUser(user: AdapterUser): Promise<AdapterUser> {
    return user;
  },

  async getUserByEmail(email: string): Promise<AdapterUser | null> {
    return null;
  },

  async getUserByAccount(provider: string, providerAccountId: string): Promise<AdapterUser | null> {
    return null;
  },

  // Other optional adapter methods can go here
};

// NextAuth v4 configuration
export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  adapter: myCustomAdapter,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).role = (user as any).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
