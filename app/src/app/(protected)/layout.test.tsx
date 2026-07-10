import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/*
 * EnsureAuthenticated gates the protected area. It reads the next-auth session
 * status and the app's own "anonymous session" flag, then decides whether to
 * show a loader, render the protected children, or redirect to /login (also
 * signing out and toasting when a real session has expired).
 *
 * All external collaborators are mocked so each session state can be driven
 * directly. redirect() is mocked to throw, mirroring Next.js where redirect()
 * halts rendering by throwing - the source relies on that behaviour (it has no
 * `return` after redirect() in the unauthenticated branch).
 */

const useSessionMock = vi.fn();
const signOutMock = vi.fn();
const toastInfoMock = vi.fn();
const useAnonymousSessionMock = vi.fn();
const redirectMock = vi.fn((_url: string) => {
    throw new Error("NEXT_REDIRECT");
});

vi.mock("next-auth/react", () => ({
    useSession: () => useSessionMock(),
    signOut: () => signOutMock(),
}));

vi.mock("next/navigation", () => ({
    redirect: (url: string) => redirectMock(url),
}));

vi.mock("sonner", () => ({
    toast: { info: (...args: unknown[]) => toastInfoMock(...args) },
}));

vi.mock("@/components/anonymous-session/anonymous-session", () => ({
    useAnonymousSession: () => useAnonymousSessionMock(),
}));

import EnsureAuthenticated from "@/app/(protected)/layout";

// Unix timestamps (in seconds) an hour on either side of now, matching the
// `expires_at` shape next-auth stores on the session.
const nowSeconds = () => Math.floor(Date.now() / 1000);
const FUTURE = () => nowSeconds() + 3600;
const PAST = () => nowSeconds() - 3600;

const child = <div data-testid="protected-child">protected content</div>;

beforeEach(() => {
    vi.clearAllMocks();
    // Default: not an anonymous session. Individual tests override as needed.
    useAnonymousSessionMock.mockReturnValue({ anonymousSession: false });
});

describe("EnsureAuthenticated", () => {
    it("shows the loading indicator while the session is loading", () => {
        useSessionMock.mockReturnValue({ status: "loading", data: null });

        render(<EnsureAuthenticated>{child}</EnsureAuthenticated>);

        expect(screen.getByTestId("auth-loading")).toBeInTheDocument();
        expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
    });

    it("renders children for an authenticated session with a future expiry", () => {
        useSessionMock.mockReturnValue({
            status: "authenticated",
            data: { expires_at: FUTURE() },
        });

        render(<EnsureAuthenticated>{child}</EnsureAuthenticated>);

        expect(screen.getByTestId("protected-child")).toBeInTheDocument();
        expect(signOutMock).not.toHaveBeenCalled();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it("signs out and redirects when an authenticated session has already expired", () => {
        useSessionMock.mockReturnValue({
            status: "authenticated",
            data: { expires_at: PAST() },
        });

        // redirect() throws (like Next.js), which propagates out of render.
        expect(() =>
            render(<EnsureAuthenticated>{child}</EnsureAuthenticated>)
        ).toThrow();

        // redirect() throws, and React may re-invoke render once for error
        // recovery, so assert the calls happened rather than an exact count.
        expect(signOutMock).toHaveBeenCalled();
        expect(toastInfoMock).toHaveBeenCalledWith(
            "Your session expired.",
            expect.objectContaining({ duration: Infinity })
        );
        expect(redirectMock).toHaveBeenCalledWith("/login");
    });

    it("renders children when unauthenticated but in an anonymous session", () => {
        useSessionMock.mockReturnValue({
            status: "unauthenticated",
            data: null,
        });
        useAnonymousSessionMock.mockReturnValue({ anonymousSession: true });

        render(<EnsureAuthenticated>{child}</EnsureAuthenticated>);

        expect(screen.getByTestId("protected-child")).toBeInTheDocument();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it("redirects to /login when unauthenticated and not anonymous", () => {
        useSessionMock.mockReturnValue({
            status: "unauthenticated",
            data: null,
        });
        useAnonymousSessionMock.mockReturnValue({ anonymousSession: false });

        expect(() =>
            render(<EnsureAuthenticated>{child}</EnsureAuthenticated>)
        ).toThrow();

        expect(redirectMock).toHaveBeenCalledWith("/login");
        expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
    });
});
