"use client";

import { useAnonymousSession } from "@/components/anonymous-session/anonymous-session";
import { LoadingSpinner } from "@/components/ui/spinners";
import { differenceInMilliseconds, fromUnixTime, isAfter } from "date-fns";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function EnsureAuthenticated({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = useSession();
    const { anonymousSession } = useAnonymousSession();

    useEffect(() => {
        if (
            session.data != null &&
            session.data.expires_at != null &&
            isAfter(fromUnixTime(session.data.expires_at), new Date())
        ) {
            const interval = setTimeout(() => {
                signOut();
                setTimeout(() => {
                    toast.info("Your session expired.");
                }, 1000);
                redirect("/login");
            }, differenceInMilliseconds(fromUnixTime(session.data.expires_at), new Date()));

            return () => {
                clearTimeout(interval);
            };
        }
    }, [session]);

    switch (session.status) {
        case "loading":
            return (
                <div className="flex justify-center items-center h-screen">
                    <div className="flex gap-3 items-center">
                        <LoadingSpinner />
                        <span className="text-lg">Loading...</span>
                    </div>
                </div>
            );
        case "unauthenticated":
            if (anonymousSession) {
                return <>{children}</>;
            }

            redirect("/login");
        case "authenticated":
            if (
                !session.data.expires_at ||
                !isAfter(fromUnixTime(session.data.expires_at), new Date())
            ) {
                signOut();
                toast.info("Your session expired.", {
                    duration: Infinity,
                });
                redirect("/login");
            }

            return <>{children}</>;
        default:
            throw new Error("Fall through on AuthRedirect switch case.");
    }
}
