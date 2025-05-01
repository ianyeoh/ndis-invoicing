import {
    DayTimeslotColumn,
    initialColumnState,
    TimeslotColumn,
} from "@/components/timeslot-picker/timeslot-day-column";
import {
    DragSelectProvider,
    useDragSelect,
} from "@/components/drag-select/drag-select";
import TimeslotAxis from "@/components/timeslot-picker/timeslot-axis";
import {
    maxPickerHeight,
    timeslotSize,
} from "@/components/timeslot-picker/timeslot-picker";
import { format } from "date-fns";
import {
    NDISCodeCombobox,
    NDISComboboxList,
} from "@/components/ndis-codes/ndis-code-combobox";
import { useEffect, useState } from "react";
import { getNDISCode, NDISCodes } from "@/components/ndis-codes/ndis-codes";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function DemoCard() {
    const today = new Date();
    const { dragSelect } = useDragSelect();
    const [codeList, setCodeList] = useState<NDISComboboxList>([]);
    const [selectedCode, setSelectedCode] = useState<string>("");
    const [dayColumnState, setDayColumnState] = useState<TimeslotColumn[]>([
        initialColumnState(),
    ]);
    const [selected, setSelected] = useState<number[][]>([]);

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

    useEffect(() => {
        /* Subscribe to on drag end event */
        if (!dragSelect) return;
        const id = dragSelect.subscribe("DS:end", (e) => {
            const idxList: number[][] = [];
            for (const item of e.items) {
                idxList.push([
                    Number(item.dataset.dayIndex),
                    Number(item.dataset.slotIndex),
                ]);
            }

            setSelected((_) => {
                return idxList;
            });
        });

        return () => dragSelect.unsubscribe("DS:end", undefined, id!);
    }, [dragSelect]);

    function applyCode() {
        if (!selectedCode) {
            toast.warning("A code must be selected before it can be applied.");
            return;
        }

        const code = getNDISCode(selectedCode);

        if (!code) {
            throw new Error(`Selected code not found: ${selectedCode}`);
        }

        const selectionCopy = structuredClone(selected);
        const newDayColumnState = structuredClone(dayColumnState);
        for (const [_, slotIndex] of selectionCopy) {
            newDayColumnState[0].timeslots[slotIndex].code = code;
        }

        dragSelect?.clearSelection();
        setSelected([]);
        setDayColumnState(newDayColumnState);
    }

    function disableDeselect() {
        dragSelect?.break();
    }

    return (
        <>
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Demo</CardTitle>
                    <CardDescription>
                        Click and drag over some timeslots below to select them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center my-2 select-none gap-5">
                        <div className="flex gap-2">
                            <div className="w-[70px]">
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">
                                        {format(today, "iii")}
                                    </div>
                                    <div className={`text-xs text-foreground`}>
                                        {format(today, "d MMM")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex gap-2">
                            <div className="absolute top-0 left-[-70px] w-[70px]">
                                <TimeslotAxis
                                    intervalSize={timeslotSize}
                                    maxHeight={maxPickerHeight}
                                />
                            </div>

                            <div className="w-[70px]">
                                <DayTimeslotColumn
                                    day={today}
                                    index={0}
                                    value={dayColumnState}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <NDISCodeCombobox
                                list={codeList}
                                value={selectedCode}
                                onValueChange={setSelectedCode}
                                onBtnMouseDown={disableDeselect}
                                onDropdownMouseDown={disableDeselect}
                            />

                            <Button
                                variant="outline"
                                className="px-2 h-8"
                                onMouseDown={disableDeselect}
                                onClick={applyCode}
                            >
                                Apply code
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function Demo() {
    return (
        <DragSelectProvider
            settings={{
                draggability: false,
                immediateDrag: false,
                selectedClass: "ds-selected",
            }}
        >
            <DemoCard />
        </DragSelectProvider>
    );
}
