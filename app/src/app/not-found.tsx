import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <>
            <div className="flex h-[100vh] w-[100vw] items-center justify-center">
                <div className="flex gap-6 items-center">
                    <h2 className="font-semibold text-xl">404</h2>
                    <p>Requested resource could not be found</p>
                </div>
            </div>
            <Button asChild className="fixed top-5 right-5">
                <Link href="/">Back to home</Link>
            </Button>
        </>
    );
}
