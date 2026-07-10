import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "next-runtime-env";
import { assertServerEnv } from "@/lib/env";

const authOptions: AuthOptions = {
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: env("NEXT_PUBLIC_GOOGLE_CLIENT_ID")!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid",
                    include_granted_scope: true,
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token = Object.assign({}, token, {
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    scope: account.scope,
                });
            }
            return token;
        },
        async session({ session, token }) {
            if (session) {
                session = Object.assign({}, session, {
                    access_token: token.access_token,
                    expires_at: token.expires_at,
                    scope: token.scope,
                });
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

// Fail fast at request time (not module import) so `next build` stays green
// without real secrets, but any auth request without valid config errors
// clearly instead of failing deep inside the OAuth flow.
async function guardedHandler(
    req: Request,
    ctx: { params: Promise<{ nextauth: string[] }> },
) {
    assertServerEnv();
    return handler(req, ctx);
}

export { guardedHandler as GET, guardedHandler as POST };
