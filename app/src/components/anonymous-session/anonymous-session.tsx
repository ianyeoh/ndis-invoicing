import { createContext, ReactNode, useContext, useState } from "react";

const AnonymousSessionContext = createContext<{
    anonymousSession: boolean;
    setAnonymousSession: () => void;
    logout: () => void;
}>({
    anonymousSession: false,
    setAnonymousSession: () => {},
    logout: () => {},
});

export function useAnonymousSession() {
    return useContext(AnonymousSessionContext);
}

export function AnonymousSessionProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [anonymousSession, setAnonymousSession] = useState<boolean>(false);

    return (
        <AnonymousSessionContext.Provider
            value={{
                anonymousSession,
                setAnonymousSession: () => {
                    setAnonymousSession(true);
                },
                logout: () => {
                    setAnonymousSession(false);
                },
            }}
        >
            {children}
        </AnonymousSessionContext.Provider>
    );
}
