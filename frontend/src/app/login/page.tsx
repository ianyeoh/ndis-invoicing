"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google/google-sign-in-button";
import { useAnonymousSession } from "@/components/anonymous-session/anonymous-session";
import Demo from "./demo";

export default function LoginPage() {
    const { setAnonymousSession } = useAnonymousSession();

    return (
        <div className="flex flex-col gap-5 min-h-screen my-10 items-center justify-center overflow-y-auto">
            <Card className="py-8 px-4 max-w-[400px]">
                <CardHeader>
                    <CardTitle>NDIS Invoicing</CardTitle>
                    <CardDescription className="mt-6">
                        A browser-side application that makes it easy to create
                        timesheets for NDIS workers that can be exported to
                        Google Sheets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        <GoogleSignInButton
                            className="w-full"
                            scopes="openid https://www.googleapis.com/auth/userinfo.profile"
                        />
                        <Button variant="outline" onClick={setAnonymousSession}>
                            Continue without signing in
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* <Demo /> */}
        </div>
    );
}
