import { NDISCode } from "@/lib/ndis-codes";
import { TimeslotColumn } from "@/lib/types";
import { addMinutes, addWeeks, Day, setDay, startOfDay } from "date-fns";

export function groupContiguousTimeslots(
    weeks: {
        [weekOffset: number]: TimeslotColumn[];
    },
    timeslotSize: number,
    weekStartsOn: Day,
    breakOnDay: boolean = true
) {
    const contiguousBlocks = [];

    let startOfBlock: {
        code: NDISCode;
        datetime: Date;
    } | null = null;
    // End of the most recently visited slot. An in-loop close ends a block at
    // the *start* of the current slot (the previous slot's end); the post-loop
    // flush has no following slot to provide that boundary, so it reuses this
    // running value, which always holds the end of the last slot that was part
    // of the still-open block.
    let lastSlotEnd: Date | null = null;
    for (const [weekOffset, dayColumns] of Object.entries(weeks)) {
        const week = startOfDay(addWeeks(new Date(), Number(weekOffset)));

        // 0 is Sunday, 1 is Monday and so on...
        for (let i = 0; i < 7; i++) {
            const dayOfWeek = (i + weekStartsOn) % 7;
            const day = setDay(week, dayOfWeek, { weekStartsOn });
            const dayColumn = dayColumns[dayOfWeek];

            let slotIndex = 0;
            for (const timeslot of dayColumn.timeslots) {
                const minutes = slotIndex * timeslotSize;
                lastSlotEnd = addMinutes(day, minutes + timeslotSize);

                if (startOfBlock != null) {
                    if (
                        timeslot.code == null ||
                        timeslot.code.itemNumber !==
                            startOfBlock.code.itemNumber ||
                        (breakOnDay && slotIndex === 0)
                    ) {
                        // end the contiguous block
                        contiguousBlocks.push({
                            code: startOfBlock.code,
                            start: startOfBlock.datetime,
                            end: addMinutes(day, minutes),
                        });
                        startOfBlock = null;
                    }
                }

                if (startOfBlock == null && timeslot.code != null) {
                    // begin the contiguous block
                    startOfBlock = {
                        code: timeslot.code,
                        datetime: addMinutes(day, minutes),
                    };
                }

                slotIndex++;
            }
        }
    }

    if (startOfBlock != null && lastSlotEnd != null) {
        // Flush a block still open after the final slot. Its true end is the
        // end of the last slot visited (which, since the block never closed,
        // belongs to the block) - not start + a single timeslot, which would
        // under-count any multi-slot trailing run.
        contiguousBlocks.push({
            code: startOfBlock.code,
            start: startOfBlock.datetime,
            end: lastSlotEnd,
        });
    }

    return contiguousBlocks;
}
