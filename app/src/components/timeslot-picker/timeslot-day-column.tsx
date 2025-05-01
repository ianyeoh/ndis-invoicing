"use client";

import Timeslot, {
    initialTimeslotState,
    TimeslotState,
} from "@/components/timeslot-picker/timeslot";
import { maxPickerHeight, timeslotSize } from "./timeslot-picker";
import { getDay } from "date-fns";
import { cn } from "@/lib/utils";

export type TimeslotColumn = {
    // not the most memory efficient way to do this, since we store null values
    // but it's good enough for now. If greater space efficiency is needed, consider
    // only storing values that contain meaningful values
    timeslots: TimeslotState[];
};

export const initialColumnState = (): TimeslotColumn => {
    const numTimeslots = (24 * 60) / timeslotSize; // inherited from timeslot-picker

    const timeslots: TimeslotState[] = [];
    for (let i = 0; i < numTimeslots; i++) {
        timeslots.push(initialTimeslotState());
    }

    return {
        timeslots,
    };
};

export function DayTimeslotColumn({
    day,
    index, // usually number from 0 - 6 indicating day of week, 0 is Sunday, 1 is Monday etc...
    value,
}: {
    day: Date;
    index: number;
    value: TimeslotColumn[];
}) {
    /* Alias for cleaner code */
    const column: TimeslotColumn = value[index];

    /* Do some math to determine the number of timeslots we should create */
    const numTimeslots = (24 * 60) / timeslotSize;
    const numTimeslotsIn1Hr = numTimeslots / 24;
    const timeslotHeight = maxPickerHeight / numTimeslots;

    /* May cause unexpected behaviour */
    if (numTimeslots - Math.floor(numTimeslots) !== 0) {
        console.warn(
            "Chosen interval size creates non-integer number of timeslots."
        );
    }

    /* Generate the timeslots */
    const timeslotList = [];
    for (let hr = 0; hr < 24; hr++) {
        /* Timeslots are containerised in a div for each hour in the day */
        const timeslotsIn1Hr = [];

        for (let i = 0; i < numTimeslotsIn1Hr; i++) {
            timeslotsIn1Hr.push(
                <Timeslot
                    key={"hr" + hr + "no." + i}
                    state={column.timeslots[hr * numTimeslotsIn1Hr + i]}
                    height={timeslotHeight}
                    className={cn(
                        (i + 1) % numTimeslotsIn1Hr !== 0 && // is last slot for the hour
                            "border-b border-border/25"
                    )}
                    dayIndex={getDay(day)}
                    slotIndex={hr * numTimeslotsIn1Hr + i}
                />
            );
        }

        timeslotList.push(
            <div
                key={"hr" + hr}
                className={cn(
                    hr !== 23 && // is not the last hour (avoid double rendering border bottom)
                        "border-b border-border"
                )}
            >
                {timeslotsIn1Hr}
            </div>
        );
    }

    return <div className="border border-border">{timeslotList}</div>;
}
