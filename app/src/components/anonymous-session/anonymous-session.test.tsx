import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    AnonymousSessionProvider,
    useAnonymousSession,
} from "@/components/anonymous-session/anonymous-session";

/*
 * The provider exposes an "anonymous session" flag plus two setters:
 * setAnonymousSession() turns it on, logout() turns it back off. These tests
 * drive a tiny consumer that renders the current flag and wires the setters
 * to buttons, then assert the flag flips as the buttons are clicked.
 */

// Minimal consumer used only by these tests to surface the context state and
// expose its setters as clickable buttons.
function Consumer() {
    const { anonymousSession, setAnonymousSession, logout } =
        useAnonymousSession();

    return (
        <div>
            <span data-testid="flag">{String(anonymousSession)}</span>
            <button data-testid="set-btn" onClick={() => setAnonymousSession()}>
                set
            </button>
            <button data-testid="logout-btn" onClick={() => logout()}>
                logout
            </button>
        </div>
    );
}

describe("AnonymousSessionProvider", () => {
    it("defaults the anonymous session flag to false", () => {
        render(
            <AnonymousSessionProvider>
                <Consumer />
            </AnonymousSessionProvider>
        );

        expect(screen.getByTestId("flag")).toHaveTextContent("false");
    });

    it("flips the flag to true when setAnonymousSession is called", async () => {
        const user = userEvent.setup();
        render(
            <AnonymousSessionProvider>
                <Consumer />
            </AnonymousSessionProvider>
        );

        await user.click(screen.getByTestId("set-btn"));

        expect(screen.getByTestId("flag")).toHaveTextContent("true");
    });

    it("flips the flag back to false when logout is called", async () => {
        const user = userEvent.setup();
        render(
            <AnonymousSessionProvider>
                <Consumer />
            </AnonymousSessionProvider>
        );

        await user.click(screen.getByTestId("set-btn"));
        expect(screen.getByTestId("flag")).toHaveTextContent("true");

        await user.click(screen.getByTestId("logout-btn"));
        expect(screen.getByTestId("flag")).toHaveTextContent("false");
    });
});
