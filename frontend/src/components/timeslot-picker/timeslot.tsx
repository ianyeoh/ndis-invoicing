import { cn } from "@/lib/utils";
import { HTMLAttributes, useEffect, useRef } from "react";
import { useDragSelect } from "../drag-select/drag-select";
import { NDISCode } from "../ndis-codes/ndis-codes";
import uniqolor from "uniqolor";

export const initialTimeslotState = (): TimeslotState => {
    return {
        code: null,
    };
};

export type TimeslotState = {
    code: NDISCode | null;
};

interface TimeslotProps extends HTMLAttributes<HTMLDivElement> {
    state: TimeslotState;
    height: number;
    className: string;
    dayIndex: number;
    slotIndex: number;
}

export default function Timeslot({
    state,
    height,
    className,
    dayIndex,
    slotIndex,
    ...props
}: TimeslotProps) {
    const ref = useRef(null);
    const { dragSelect } = useDragSelect();

    // register as a selectable element
    useEffect(() => {
        const element = ref.current as unknown as HTMLElement;
        if (!element || !dragSelect) return;
        dragSelect.addSelectables(element);
    }, [dragSelect, ref]);

    return (
        <div
            ref={ref}
            style={{
                height,
                backgroundColor:
                    state.code != null
                        ? uniqolor(state.code.itemNumber, {
                              lightness: 75,
                          }).color
                        : undefined,
            }}
            className={cn(className)}
            data-day-index={dayIndex}
            data-slot-index={slotIndex}
            {...props}
        ></div>
    );
}
