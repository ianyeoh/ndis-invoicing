"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ReactNode, RefAttributes, useEffect, useRef, useState } from "react";
import { Button, ButtonProps } from "../ui/button";
import { X } from "lucide-react";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { useSession } from "next-auth/react";
import useDrivePicker from "react-google-drive-picker";
import { useDragSelect } from "../drag-select/drag-select";
import { LoadingSpinner } from "../ui/spinners";
import SheetDetailsForm from "../forms/sheet-details-form";
import { TimeslotColumn } from "../timeslot-picker/timeslot-day-column";
import { isScopeGranted } from "@/lib/google-oauth2";
import { GoogleSignInButton } from "./google-sign-in-button";
import { usePathname, useSearchParams } from "next/navigation";
import { env } from "next-runtime-env";

type SheetState =
    | {
          state: "idle";
      }
    | {
          state: "loading";
      }
    | {
          state: "loaded";
          spreadsheet: GoogleSpreadsheet;
      }
    | {
          state: "error";
          error: string;
      };

export function ExportToSheetsFlow({
    selection,
    children,
    className,
    variant,
    ...props
}: {
    selection: {
        [weekOffset: number]: TimeslotColumn[];
    };
    children?: ReactNode;
    className?: string;
    variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
} & ButtonProps &
    RefAttributes<HTMLButtonElement>) {
    const session = useSession();
    const { enable, disable } = useDragSelect();
    const [openPicker] = useDrivePicker();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const exportFlow = searchParams.get("export");

    const startFlowRef = useRef<HTMLButtonElement>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
    const [addScopesDialogOpen, setAddScopesDialogOpen] =
        useState<boolean>(false);
    const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
    const [sheetState, setSheetState] = useState<SheetState>({
        state: "idle",
    });

    useEffect(() => {
        if (exportDialogOpen || addScopesDialogOpen) {
            disable();
        } else {
            enable();
        }
    }, [exportDialogOpen, addScopesDialogOpen]);

    useEffect(() => {
        if (exportFlow === "google-sheets") {
            setTimeout(() => {
                startFlowRef.current?.click();
            }, 1000);
        }
    }, [exportFlow]);

    function startExportFlow() {
        if (ensureCorrectScopes()) {
            openDrivePicker();
        }
    }

    function ensureCorrectScopes() {
        if (
            !session.data ||
            !isScopeGranted(
                session.data,
                "https://www.googleapis.com/auth/drive.readonly"
            ) ||
            !isScopeGranted(
                session.data,
                "https://www.googleapis.com/auth/spreadsheets"
            )
        ) {
            setAddScopesDialogOpen(true);
            return false;
        }

        return true;
    }

    function openDrivePicker() {
        if (!session || !session.data || !session.data.access_token) {
            throw new Error("Tried to open gpicker without valid token.");
        }
        const token = session.data.access_token;

        closeDialogs(); // shouldn't happen, but just in case since they mutually break each other
        disable();
        openPicker({
            clientId: env("NEXT_PUBLIC_GOOGLE_CLIENT_ID")!,
            developerKey: env("NEXT_PUBLIC_GOOGLE_PICKER_DEVELOPER_KEY")!,
            viewId: "SPREADSHEETS",
            token, // already have the token
            callbackFunction: (data) => {
                switch (data.action.toLowerCase()) {
                    case "cancel":
                        closeDialogs();
                        enable();
                        break;
                    case "loaded":
                        // do nothing
                        break;
                    case "picked":
                        setExportDialogOpen(true);

                        if (data.docs.length === 0) {
                            throw new Error(
                                "Picker returned empty list of documents"
                            );
                        }

                        if (data.docs.length > 1) {
                            throw new Error(
                                "Picker has multi-select enabled. Is this intentional?"
                            );
                        }

                        const spreadsheet = data.docs[0];
                        setSelectedSheetId(spreadsheet.id);
                        loadGoogleSheet(spreadsheet.id);

                        break;
                    default:
                        throw new Error(
                            `Unknown picker action ${data.action.toLowerCase()}`
                        );
                }
            },
        });
    }

    function closeDialogs() {
        setAddScopesDialogOpen(false);
        setExportDialogOpen(false);
    }

    async function loadGoogleSheet(id: string) {
        setSheetState({
            state: "loading",
        });

        if (!session || !session.data || !session.data.access_token) {
            throw new Error("Tried to open gpicker without valid token.");
        }
        const token = session.data.access_token;

        try {
            const spreadsheet = new GoogleSpreadsheet(id, { token });
            await spreadsheet.loadInfo();
            setSheetState({
                state: "loaded",
                spreadsheet,
            });
        } catch (err) {
            setSheetState({
                state: "error",
                error: (err as Error).message,
            });
        }
    }

    return (
        <>
            <Button
                ref={startFlowRef}
                className={className}
                variant={!variant ? "outline" : variant}
                onClick={startExportFlow}
                {...props}
            >
                {!children ? (
                    <div className="flex gap-2 items-center">
                        <img
                            className="w-[22px]"
                            src="https://lh3.googleusercontent.com/yCF7mTvXRF_EhDf7Kun5_-LMYTbD2IL-stx_D97EzpACfhpGjY_Frx8NZw63rSn2dME0v8-Im49Mh16htvPAGmEOMhiTxDZzo6rB7MY"
                        />
                        Export to Google Sheets
                    </div>
                ) : (
                    children
                )}
            </Button>
            <AlertDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
            >
                <AlertDialogContent className="overflow-y-auto max-h-screen">
                    <AlertDialogHeader>
                        <div className="flex items-center">
                            <AlertDialogTitle>
                                Export to Google Sheets
                            </AlertDialogTitle>
                            <div className="grow"></div>
                            <AlertDialogCancel className="p-1 h-fit border-0">
                                <X />
                            </AlertDialogCancel>
                        </div>

                        <AlertDialogDescription>
                            Enter some extra information to export your
                            timesheet into a Google Sheets invoice. A new
                            worksheet will be created in the selected
                            spreadsheet.
                        </AlertDialogDescription>

                        {sheetState.state === "loading" && (
                            <div className="h-[150px] w-full flex items-center justify-center">
                                <div className="flex gap-2 items-center">
                                    Loading <LoadingSpinner />
                                </div>
                            </div>
                        )}

                        {sheetState.state === "error" && (
                            <div className="px-1 py-5">
                                <div className="text-sm">
                                    We ran into the following error while trying
                                    to fetch data from your spreadsheet:
                                </div>
                                <div className="mt-2 text-xs">
                                    {sheetState.error}
                                </div>
                            </div>
                        )}

                        {sheetState.state === "idle" && (
                            <div className="px-1 py-5">
                                Something went wrong when selecting your sheet.
                                Please try again.
                            </div>
                        )}

                        {sheetState.state === "loaded" && (
                            <div className="px-1 py-5">
                                <SheetDetailsForm
                                    spreadsheet={sheetState.spreadsheet}
                                    selection={selection}
                                />
                            </div>
                        )}
                    </AlertDialogHeader>

                    {selectedSheetId != null &&
                        sheetState.state === "error" && (
                            <AlertDialogFooter>
                                <Button
                                    onClick={() => {
                                        loadGoogleSheet(selectedSheetId);
                                    }}
                                >
                                    Try again
                                </Button>
                            </AlertDialogFooter>
                        )}
                </AlertDialogContent>
            </AlertDialog>
            <Dialog
                open={addScopesDialogOpen}
                onOpenChange={setAddScopesDialogOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="mb-2">
                            Extra account access required
                        </DialogTitle>
                        <DialogDescription>
                            Exporting to one of your Google Sheet spreadsheets
                            requires greater access permissions (read-only
                            access to Google Drive, and write access to Google
                            Sheets).
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <GoogleSignInButton
                            className="grow"
                            callbackURL={`${pathname}?export=google-sheets`}
                            scopes="openid https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile"
                        >
                            Grant access
                        </GoogleSignInButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
