import { Session } from "next-auth";

export function isScopeGranted(session: Session, scope: string) {
    const scopeList = session.scope.split(" ");
    return scopeList.includes(scope);
}
