"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/spinners";

export default function AuthRedirect() {
    const session = useSession();

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
            redirect("/login");
        default:
            throw new Error("Fall through on AuthRedirect switch case.");
    }
}
