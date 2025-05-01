import { TimeslotColumn } from "@/components/timeslot-picker/timeslot-day-column";

const sessionKey = "invoicing-session";

type Session = {
    [weekOffset: number]: TimeslotColumn[];
};

export function loadSession() {
    const session = localStorage.getItem(sessionKey);

    if (session) {
        return JSON.parse(session);
    }

    return null;
}

export function saveSession(session: Session) {
    localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
    localStorage.removeItem(sessionKey);
}
