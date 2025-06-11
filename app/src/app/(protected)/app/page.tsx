"use client";

import { useEffect, useState } from "react";
import TimeslotPicker, {
    initialPickerState,
    TimeslotPickerState,
} from "@/components/timeslot-picker/timeslot-picker";
import { Button } from "@/components/ui/button";
import { useHotkeys } from "react-hotkeys-hook";
import {
    DragSelectProvider,
    useDragSelect,
} from "@/components/drag-select/drag-select";
import {
    NDISCodes,
    CodeSlotMap,
    getNDISCode,
    DayTypes,
} from "@/components/ndis-codes/ndis-codes";
import {
    NDISCodeCombobox,
    NDISComboboxList,
} from "@/components/ndis-codes/ndis-code-combobox";
import { toast } from "sonner";
import { addWeeks, isSaturday, isSunday, setDay } from "date-fns";
import { ExportToSheetsFlow } from "@/components/google/sheets-export-flow";
import { clearSession, loadSession, saveSession } from "./session";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar";
import SelectionsDataDialog from "@/components/data-tables/selections-data-table/selections-data-dialog";

function App() {
    const { dragSelect, enable, disable } = useDragSelect();
    const [timeSelection, setTimeSelection] = useState<TimeslotPickerState>(
        initialPickerState()
    );
    const [selectedCode, setSelectedCode] = useState<string>("");
    const [codeList, setCodeList] = useState<NDISComboboxList>([]);
    const [resetDialogOpen, setResetDialogOpen] = useState<boolean>(false);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState<boolean>(false);

    const weekStartsOn = 1; // 0 = Sunday, 1 = Monday, etc.

    /* Load saved session on first load */
    useEffect(() => {
        const session = loadSession();

        if (session) {
            toast("Data from a previous session was successfully recovered.");
            setTimeSelection({
                ...timeSelection,
                columns: session,
            });
        }
    }, []);

    /* Generate code list for combobox */
    useEffect(() => {
        const newCodeList = [];
        for (const { itemNumber, itemName } of NDISCodes) {
            newCodeList.push({
                value: itemNumber,
                label: itemName,
            });
        }

        setCodeList(newCodeList);
    }, NDISCodes);

    /* For all the dialogs on the page, disable drag select if any are open,
     * and enable if all are closed
     */
    useEffect(() => {
        if ([resetDialogOpen, summaryDialogOpen].some((open) => open)) {
            disable();
        }

        if ([resetDialogOpen, summaryDialogOpen].every((open) => !open)) {
            enable();
        }
    }, [resetDialogOpen, summaryDialogOpen]);

    /* Hotkey actions */
    useHotkeys("Enter", applyDefaultSelection);
    useHotkeys("Escape", clearDragSelection);
    useHotkeys("Backspace", deleteSelection);
    useHotkeys("Delete", deleteSelection);
    useHotkeys("Shift+Enter", () => {
        applySpecificCode(selectedCode);
    });

    function clearDragSelection() {
        if (!dragSelect) return;

        dragSelect.clearSelection();
        setTimeSelection((prevState) => {
            return {
                ...prevState,
                selected: [],
            };
        });
    }

    function selectDayType(date: Date): DayTypes {
        if (isSaturday(date)) {
            return "Saturday";
        } else if (isSunday(date)) {
            return "Sunday";
        } else {
            return "Weekday";
        }
    }

    function resetSelections() {
        dragSelect?.clearSelection();
        setTimeSelection(initialPickerState());
        clearSession();
    }

    function applyDefaultSelection() {
        const selectionCopy = structuredClone(timeSelection.selected);
        clearDragSelection();

        const { weekOffset, columns } = timeSelection;
        const today = new Date();
        const week = addWeeks(today, weekOffset);

        const dayColumns = structuredClone(columns[weekOffset]);
        for (const [dayIndex, slotIndex] of selectionCopy) {
            const selectionDate = setDay(week, dayIndex);
            const dayType = selectDayType(selectionDate);

            dayColumns[dayIndex].timeslots[slotIndex].code =
                CodeSlotMap[dayType][slotIndex].codes[0];
        }

        setTimeSelection((prevState) => {
            saveSession({
                ...prevState.columns,
                [weekOffset]: dayColumns,
            });

            return {
                ...prevState,
                columns: {
                    ...prevState.columns,
                    [weekOffset]: dayColumns,
                },
            };
        });
    }

    function deleteSelection() {
        const selectionCopy = structuredClone(timeSelection.selected);
        clearDragSelection();

        const { weekOffset, columns } = timeSelection;
        const dayColumns = structuredClone(columns[weekOffset]);
        for (const [dayIndex, slotIndex] of selectionCopy) {
            dayColumns[dayIndex].timeslots[slotIndex].code = null;
        }

        setTimeSelection((prevState) => {
            saveSession({
                ...prevState.columns,
                [weekOffset]: dayColumns,
            });

            return {
                ...prevState,
                columns: {
                    ...prevState.columns,
                    [weekOffset]: dayColumns,
                },
            };
        });
    }

    function applySpecificCode(itemNumber?: string) {
        if (!itemNumber) {
            toast.warning("A code must be selected before it can be applied.");
            return;
        }

        const code = getNDISCode(itemNumber);

        if (!code) {
            throw new Error(`Selected code not found: ${itemNumber}`);
        }

        const selectionCopy = structuredClone(timeSelection.selected);
        clearDragSelection();

        const { weekOffset, columns } = timeSelection;
        const dayColumns = structuredClone(columns[weekOffset]);
        for (const [dayIndex, slotIndex] of selectionCopy) {
            dayColumns[dayIndex].timeslots[slotIndex].code = code;
        }

        setTimeSelection((prevState) => {
            saveSession({
                ...prevState.columns,
                [weekOffset]: dayColumns,
            });

            return {
                ...prevState,
                columns: {
                    ...prevState.columns,
                    [weekOffset]: dayColumns,
                },
            };
        });
    }

    function disableDeselect() {
        dragSelect?.break();
    }

    return (
        <>
            {/* <SelectionInfoToast /> */}

            <AlertDialog
                open={resetDialogOpen}
                onOpenChange={setResetDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will reset your
                            session and clear all existing selections.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSelections}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SelectionsDataDialog
                open={summaryDialogOpen}
                onOpenChange={setSummaryDialogOpen}
                selections={timeSelection.columns}
                weekStartsOn={weekStartsOn}
            />

            <div className="pt-5 flex justify-center gap-5 select-none min-w-[1050px]">
                <TimeslotPicker
                    weekStartsOn={weekStartsOn}
                    value={timeSelection}
                    onValueChange={setTimeSelection}
                />

                <div className="flex flex-col gap-5">
                    <Menubar>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem disabled={true}>
                                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem disabled={true}>
                                    Redo <MenubarShortcut>⌘Y</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem
                                    onClick={() => {
                                        setResetDialogOpen(true);
                                    }}
                                >
                                    Reset
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>View</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem
                                    onClick={() => {
                                        setSummaryDialogOpen(true);
                                    }}
                                >
                                    Selection summary
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>

                    <div className="border border-border rounded-md px-5 py-4">
                        <span className="font-semibold">Shortcuts</span>

                        <div className="flex flex-col gap-2 mt-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xs">
                                    Apply default codes to selection
                                </span>
                                <div className="grow"></div>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={applyDefaultSelection}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Enter ↵
                                    </MenubarShortcut>
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs">
                                    Delete codes in selection
                                </span>
                                <div className="grow"></div>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={deleteSelection}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Backspace ⟵
                                    </MenubarShortcut>
                                </Button>
                                <span className="text-xs">or</span>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={deleteSelection}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Del
                                    </MenubarShortcut>
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs">Deselect</span>
                                <div className="grow"></div>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={clearDragSelection}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Esc ⎋
                                    </MenubarShortcut>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border border-border rounded-md px-5 py-4">
                        <span className="font-semibold">
                            Apply a specific code
                        </span>

                        <div className="mt-5 flex flex-col gap-3">
                            <NDISCodeCombobox
                                list={codeList}
                                value={selectedCode}
                                onValueChange={setSelectedCode}
                                onBtnMouseDown={disableDeselect}
                                onDropdownMouseDown={disableDeselect}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs">
                                    Apply selected code to selection
                                </span>
                                <div className="grow"></div>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={() => {
                                        applySpecificCode(selectedCode);
                                    }}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Shift ⇧
                                    </MenubarShortcut>
                                </Button>
                                <span className="text-xs">+</span>
                                <Button
                                    variant="outline"
                                    className="px-2 h-8"
                                    onMouseDown={disableDeselect}
                                    onClick={() => {
                                        applySpecificCode(selectedCode);
                                    }}
                                >
                                    <MenubarShortcut className="tracking-tight">
                                        Enter ↵
                                    </MenubarShortcut>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border border-border rounded-md px-5 py-4">
                        <span className="font-semibold">Export</span>
                        <ExportToSheetsFlow
                            variant="outline"
                            weekStartsOn={weekStartsOn}
                            selection={timeSelection.columns}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default function AppPage() {
    return (
        <DragSelectProvider
            settings={{
                draggability: false,
                immediateDrag: false,
                selectedClass: "ds-selected",
            }}
        >
            <App />
        </DragSelectProvider>
    );
}
