import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        access_token?: string;
        expires_at?: number;
        scope: string;
        user: {} & DefaultSession["user"];
    }
}
