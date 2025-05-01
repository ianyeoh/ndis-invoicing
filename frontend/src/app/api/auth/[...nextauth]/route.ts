import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
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

export { handler as GET, handler as POST };
