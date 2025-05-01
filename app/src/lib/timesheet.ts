import { NDISCode } from "@/components/ndis-codes/ndis-codes";
import { TimeslotColumn } from "@/components/timeslot-picker/timeslot-day-column";
import { addMinutes, addWeeks, setDay, startOfDay } from "date-fns";

export function groupContiguousTimeslots(
    weeks: {
        [weekOffset: number]: TimeslotColumn[];
    },
    timeslotSize: number,
    breakOnDay: boolean = true
) {
    const contiguousBlocks = [];

    let startOfBlock: {
        code: NDISCode;
        datetime: Date;
    } | null = null;
    for (const [weekOffset, dayColumns] of Object.entries(weeks)) {
        const week = startOfDay(addWeeks(new Date(), Number(weekOffset)));

        // 0 is Sunday, 1 is Monday and so on...
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const day = setDay(week, dayOfWeek);
            const dayColumn = dayColumns[dayOfWeek];

            let slotIndex = 0;
            for (const timeslot of dayColumn.timeslots) {
                const minutes = slotIndex * timeslotSize;

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

    if (startOfBlock != null) {
        // end the contiguous block
        contiguousBlocks.push({
            code: startOfBlock.code,
            start: startOfBlock.datetime,
            end: addMinutes(startOfBlock.datetime, timeslotSize),
        });
    }

    return contiguousBlocks;
}
