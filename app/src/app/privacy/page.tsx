"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex flex-col gap-5 min-h-screen my-10 items-center justify-center overflow-y-auto">
            <Card className="py-8 px-4 max-w-[700px]">
                <CardHeader>
                    <CardTitle>Privacy Policy</CardTitle>
                    <CardDescription className="mt-6">
                        This application is purely a frontend application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                        None of your Google data is stored, saved or sent outside
                        your computer except to Google's own Drive and Sheets
                        APIs that you authorise on your Google account. Only the
                        Google Sheet spreadsheet you choose through the Google
                        Drive picker is ever modified by this application.
                    </p>
                    <div className="mt-4 flex justify-end">
                        <Button>
                            <Link href="/login">Back to login</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* <Demo /> */}
        </div>
    );
}
