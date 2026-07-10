import { afterEach, describe, expect, it } from "vitest";

import { loadSession, saveSession, clearSession } from "./session";

/*
 * loadSession reads the invoicing session from localStorage and JSON-parses it.
 * A corrupt blob (e.g. a partially written value, or storage tampered with by
 * another tab) must not throw and white-screen the app - it should be discarded
 * so the app starts from a clean slate.
 */

const sessionKey = "invoicing-session";

describe("loadSession", () => {
    afterEach(() => {
        localStorage.clear();
    });

    it("returns null when no session is stored", () => {
        expect(loadSession()).toBeNull();
    });

    it("returns the parsed session for valid JSON", () => {
        const stored = { 0: [{ timeslots: [{ code: null }] }] };
        saveSession(stored as never);

        expect(loadSession()).toEqual(stored);
    });

    it("returns null and clears the key for a corrupt blob", () => {
        localStorage.setItem(sessionKey, "{not valid json");

        expect(loadSession()).toBeNull();
        // The corrupt value is removed so it cannot break the next load.
        expect(localStorage.getItem(sessionKey)).toBeNull();
    });

    it("clearSession removes a stored session", () => {
        saveSession({ 0: [] } as never);
        clearSession();

        expect(localStorage.getItem(sessionKey)).toBeNull();
    });
});
