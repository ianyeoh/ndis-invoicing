"use client";

import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GoogleSignInButton({
    className,
    scopes,
    callbackURL,
    children,
}: {
    className?: string;
    scopes?: string;
    callbackURL?: string;
    children?: ReactNode;
}) {
    return (
        <Button
            variant="outline"
            className={cn("gap-3", className)}
            onClick={() =>
                signIn(
                    "google",
                    {
                        callbackUrl: callbackURL,
                    },
                    {
                        scope:
                            scopes ??
                            "openid https://www.googleapis.com/auth/userinfo.profile",
                    }
                )
            }
        >
            <img
                className="h-[20px]"
                src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
            />
            {children ?? "Sign in with Google"}
        </Button>
    );
}
