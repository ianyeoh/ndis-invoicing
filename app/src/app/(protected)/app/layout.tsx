"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import nameInitials from "name-initials";
import { useAnonymousSession } from "@/components/anonymous-session/anonymous-session";

export default function AppNavBar({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { data: session } = useSession();
    const { anonymousSession } = useAnonymousSession();

    if (!session && !anonymousSession) return;

    let { name, image } = session
        ? session.user
        : {
              name: "User",
              image: undefined,
          };

    if (!image) {
        // have to do this to get AvatarImage to render correctly?
        image = undefined;
    }

    if (!name) {
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
                <div className="container flex max-w-(--breakpoint-2xl) items-center py-2 gap-2">
                    <div className="mr-4 hidden md:flex"></div>
                    <div className="grow"></div>

                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-full">
                            <Avatar className="h-6 w-6 select-none">
                                <AvatarImage src={image} />

                                <AvatarFallback className="text-xs">
                                    {!name ? "U" : nameInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>
                                {!name ? "User" : name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()}>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
