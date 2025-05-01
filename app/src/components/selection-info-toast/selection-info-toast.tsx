import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDragSelect } from "../drag-select/drag-select";
import { DSInputElement } from "dragselect";

export default function SelectionInfoToast({}: {}) {
    const { dragSelect } = useDragSelect();
    const toastId = useRef<string | number | null>(null);
    const [selectionRange, setSelectionRange] = useState<{
        dayStart: number | null;
        dayEnd: number | null;
        timeStart: number | null;
        timeEnd: number | null;
    }>({
        dayStart: null,
        dayEnd: null,
        timeStart: null,
        timeEnd: null,
    });

    useEffect(() => {
        const newToastId = toast("");
        toastId.current = newToastId;
        setTimeout(() => {
            toast.dismiss(newToastId);
        }, 100);
    }, []);

    useEffect(() => {
        /* Subscribe to on drag start event */
        if (!dragSelect) return;
        const id = dragSelect.subscribe("DS:start", () => {
            if (toastId.current) {
                toast.message("Selecting", {
                    id: toastId.current,
                    duration: Infinity,
                    closeButton: false,
                });
            }
        });
        return () => dragSelect.unsubscribe("DS:start", undefined, id!);
    }, [dragSelect]);

    useEffect(() => {
        /* Subscribe to on drag select event */
        if (!dragSelect) return;
        const id = dragSelect.subscribe("DS:select", (e) => {
            console.log("select", e.items.length);
        });
        return () => dragSelect.unsubscribe("DS:select", undefined, id!);
    }, [dragSelect]);

    useEffect(() => {
        /* Subscribe to on drag unselect event */
        if (!dragSelect) return;
        const id = dragSelect.subscribe("DS:unselect", (e) => {});
        return () => dragSelect.unsubscribe("DS:unselect", undefined, id!);
    }, [dragSelect]);

    useEffect(() => {
        /* Subscribe to on drag end event */
        if (!dragSelect) return;
        const id = dragSelect.subscribe("DS:end", () => {
            if (toastId.current) {
                toast.dismiss(toastId.current);
            }

            setSelectionRange({
                dayStart: null,
                dayEnd: null,
                timeStart: null,
                timeEnd: null,
            });
        });
        return () => dragSelect.unsubscribe("DS:end", undefined, id!);
    }, [dragSelect]);

    useEffect(() => {
        /* Update toast if active with current selectionRange */
        if (toastId.current) {
            const { dayStart, dayEnd, timeStart, timeEnd } = selectionRange;

            if (!dayStart || !dayEnd || !timeStart || !timeEnd) return;

            toast.message("Selecting", {
                id: toastId.current,
                duration: Infinity,
                closeButton: false,
                description: `${dayStart} ${dayEnd} ${timeStart} ${timeEnd}`,
            });
        }
    }, [selectionRange, toastId]);

    function updateRange(e: { items: DSInputElement[] }) {
        if (!e.items) {
            setSelectionRange({
                dayStart: null,
                dayEnd: null,
                timeStart: null,
                timeEnd: null,
            });
            return;
        }

        let minSlotIndex = null;
        let maxSlotIndex = null;
        let minDayIndex = null;
        let maxDayIndex = null;
        console.log(e.items);
        for (const item of e.items) {
            const dayIndex = Number(item.dataset.dayIndex);
            if (!minDayIndex || dayIndex < minDayIndex) minDayIndex = dayIndex;
            if (!maxDayIndex || dayIndex > maxDayIndex) maxDayIndex = dayIndex;

            const slotIndex = Number(item.dataset.slotIndex);
            console.log("slotindex", slotIndex, "min", minSlotIndex);
            if (!minSlotIndex || slotIndex < minSlotIndex)
                minSlotIndex = slotIndex;
            if (!maxSlotIndex || slotIndex > maxSlotIndex)
                maxSlotIndex = slotIndex;
        }

        setSelectionRange({
            dayStart: minDayIndex,
            dayEnd: maxDayIndex,
            timeStart: minSlotIndex,
            timeEnd: maxSlotIndex,
        });
    }

    return <>{JSON.stringify(selectionRange)}</>;
}
