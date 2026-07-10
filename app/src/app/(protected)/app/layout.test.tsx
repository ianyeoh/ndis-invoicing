import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/*
 * AppNavBar shows the signed-in user's initials in an avatar and a dropdown
 * with the user's name and a "Sign out" action. For an anonymous session it
 * falls back to the label "User" / initial "U". A signed-out, non-anonymous
 * visitor renders nothing.
 *
 * The avatar and dropdown UI primitives are Radix components that portal their
 * content and depend on pointer/image state that jsdom does not simulate well.
 * They are mocked here with plain inline elements that FORWARD the real props
 * the source passes (crucially the data-testid and onClick on the sign-out
 * item, and the data-testid on the avatar fallback) so the source's own wiring
 * is what gets asserted, not the mock's.
 */

const useSessionMock = vi.fn();
const signOutMock = vi.fn();
const useAnonymousSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
    useSession: () => useSessionMock(),
    signOut: () => signOutMock(),
}));

vi.mock("@/components/anonymous-session/anonymous-session", () => ({
    useAnonymousSession: () => useAnonymousSessionMock(),
}));

vi.mock("@/components/ui/theme-toggle", () => ({
    ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Avatar mock: render children inline and forward the data-testid the source
// puts on the fallback so the initials it computes are what we assert.
vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    AvatarImage: () => null,
    AvatarFallback: ({
        "data-testid": testId,
        children,
    }: {
        "data-testid"?: string;
        children: React.ReactNode;
    }) => <div data-testid={testId}>{children}</div>,
}));

// Dropdown mock: render everything inline (no portal) and forward the
// data-testid + onClick the source sets on the sign-out item.
vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="menu-label">{children}</div>
    ),
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuItem: ({
        "data-testid": testId,
        onClick,
        children,
    }: {
        "data-testid"?: string;
        onClick?: () => void;
        children: React.ReactNode;
    }) => (
        <button data-testid={testId} onClick={onClick}>
            {children}
        </button>
    ),
}));

import AppNavBar from "@/app/(protected)/app/layout";

beforeEach(() => {
    vi.clearAllMocks();
    useAnonymousSessionMock.mockReturnValue({ anonymousSession: false });
});

describe("AppNavBar", () => {
    it("renders the initials and name for a signed-in user", () => {
        useSessionMock.mockReturnValue({
            data: { user: { name: "Jane Doe", image: undefined } },
        });

        render(
            <AppNavBar>
                <div data-testid="page-content">page</div>
            </AppNavBar>
        );

        expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("JD");
        expect(screen.getByTestId("menu-label")).toHaveTextContent("Jane Doe");
        expect(screen.getByTestId("page-content")).toBeInTheDocument();
    });

    it("falls back to the User / U labels for an anonymous session", () => {
        // No next-auth session, but the anonymous flag is set.
        useSessionMock.mockReturnValue({ data: null });
        useAnonymousSessionMock.mockReturnValue({ anonymousSession: true });

        render(
            <AppNavBar>
                <div data-testid="page-content">page</div>
            </AppNavBar>
        );

        expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("U");
        expect(screen.getByTestId("menu-label")).toHaveTextContent("User");
    });

    it("calls signOut when the sign-out menu item is clicked", async () => {
        const user = userEvent.setup();
        useSessionMock.mockReturnValue({
            data: { user: { name: "Jane Doe", image: undefined } },
        });

        render(
            <AppNavBar>
                <div>page</div>
            </AppNavBar>
        );

        await user.click(screen.getByTestId("sign-out-item"));

        expect(signOutMock).toHaveBeenCalledTimes(1);
    });
});
