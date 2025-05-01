"use client";

import { useAnonymousSession } from "@/components/anonymous-session/anonymous-session";
import { LoadingSpinner } from "@/components/ui/spinners";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function EnsureUnauthenticated({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = useSession();
    const { anonymousSession } = useAnonymousSession();

    if (anonymousSession) {
        redirect("/app");
    }

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
        case "authenticated":
            redirect("/app");
        case "unauthenticated":
            return <>{children}</>;
        default:
            throw new Error("Fall through on AuthRedirect switch case.");
    }
}
