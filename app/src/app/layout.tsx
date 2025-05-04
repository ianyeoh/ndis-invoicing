"use client";

import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { AnonymousSessionProvider } from "@/components/anonymous-session/anonymous-session";
import { PublicEnvScript } from "next-runtime-env";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <PublicEnvScript />
            </head>
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable
                )}
            >
                <SessionProvider>
                    <AnonymousSessionProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <main>{children}</main>
                            <Toaster
                                expand={true}
                                pauseWhenPageIsHidden
                                richColors
                                closeButton
                            />
                        </ThemeProvider>
                    </AnonymousSessionProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
