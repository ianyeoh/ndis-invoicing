import { TimeslotColumn } from "@/components/timeslot-picker/timeslot-day-column";

const sessionKey = "invoicing-session";

type Session = {
    [weekOffset: number]: TimeslotColumn[];
};

export function loadSession() {
    const session = localStorage.getItem(sessionKey);

    if (session) {
        try {
            return JSON.parse(session);
        } catch {
            // A corrupt blob would otherwise throw and white-screen the app on
            // load. Discard it and start fresh instead.
            clearSession();
            return null;
        }
    }

    return null;
}

export function saveSession(session: Session) {
    localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
    localStorage.removeItem(sessionKey);
}
