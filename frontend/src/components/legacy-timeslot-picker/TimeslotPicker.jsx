"use client";

import { useState, useRef } from "react";
import TimeslotDay from "@/components/legacy-timeslot-picker/TimeslotDay";
import TimeslotAxis from "@/components/timeslot-picker/timeslot-axis";
import { daysOfWeek } from "@/components/legacy-timeslot-picker/constants";
import {
    addWeeks,
    findDateInArray,
    datesAreOnSameDay,
} from "@/components/legacy-timeslot-picker/date-utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    format,
    eachDayOfInterval,
    endOfWeek as getEndOfWeek,
    startOfWeek as getStartOfWeek,
    isToday,
} from "date-fns";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";

const maxTimeslotHeight = 840; // in pixels, pick a number evenly divisible by 24
const timeslotSize = 15; // in minutes

function TimeslotPicker(props) {
    const [weekOffset, setWeekOffset] = useState(0);

    useHotkeys("ArrowLeft", () => setWeekOffset(weekOffset - 1), [weekOffset]);
    useHotkeys("ArrowRight", () => setWeekOffset(weekOffset + 1), [weekOffset]);

    const today = new Date();
    const currentWeek = addWeeks(today, weekOffset);
    const startOfWeek = getStartOfWeek(currentWeek);
    const endOfWeek = getEndOfWeek(currentWeek);

    function displayRelativeWeeks() {
        switch (weekOffset) {
            case 0:
                return "This week";
            case 1:
                return "Next week";
            case -1:
                return "Last week";
            default:
                if (weekOffset > 0) {
                    return `${weekOffset} weeks from now`;
                } else {
                    return `${Math.abs(weekOffset)} weeks ago`;
                }
        }
    }

    /*
     * Array that stores the selections the user has made for every day.
     * Is ref and not state since each TimeslotDay maintains it's own state, and simply
     * passes it up to us (the TimeslotPicker) on a change (handleOnChange). Used to maintain
     * previous selections of weeks not currently being rendered. Each day is stored as:
     *      [{
     *          date: Date object,
     *          selection: []
     *       }, ...]
     */
    const selections = useRef(new Array());

    /* Function passed to each TimeslotDay to handle a selection change */
    function handleOnChange(event) {
        let index = findDateInArray(event.date, selections.current);
        if (index == -1) {
            /* Append */
            selections.current.push(event);
        } else {
            /* Update existing entry */
            selections.current[index] = event;
        }

        /* Parse out selections into a useful format and pass upwards */
        let parsedSelections = [];
        for (const element of selections.current) {
            let inSelection, selectionStart, selectionEnd, selectionLength;
            for (let i = 0; i < element.selection.length; i++) {
                if (element.selection[i] && !inSelection) {
                    /* Start a new selection */
                    inSelection = true;
                    selectionStart = i;
                    selectionEnd = i + 1;
                    selectionLength = 1;
                } else if (element.selection[i] && inSelection) {
                    /* Extend current selection*/
                    selectionEnd = i + 1;
                    selectionLength++;
                } else if (!element.selection[i] && inSelection) {
                    /* End current selection */
                    inSelection = false;

                    /* Calculate times */
                    let totalLengthInMinutes = timeslotSize * selectionLength;
                    let totalLengthInHours = totalLengthInMinutes / 60;
                    let startMinutes = (selectionStart * timeslotSize) % 60;
                    let startHours =
                        (selectionStart * timeslotSize - startMinutes) / 60;
                    let endMinutes = (selectionEnd * timeslotSize) % 60;
                    let endHours =
                        (selectionEnd * timeslotSize - endMinutes) / 60;

                    parsedSelections.push({
                        date: element.date,
                        totalLengthInHours: totalLengthInHours,
                        totalLengthInMinutes: totalLengthInMinutes,
                        startHours: startHours,
                        startMinutes: startMinutes,
                        endHours: endHours,
                        endMinutes: endMinutes,
                    });
                }
            }

            /* Handle case where selection includes the last timeslot */
            if (inSelection) {
                /* Calculate times */
                let totalLengthInMinutes = timeslotSize * selectionLength;
                let totalLengthInHours = totalLengthInMinutes / 60;
                let startMinutes = (selectionStart * timeslotSize) % 60;
                let startHours =
                    (selectionStart * timeslotSize - startMinutes) / 60;
                let endMinutes = (selectionEnd * timeslotSize) % 60;
                let endHours = (selectionEnd * timeslotSize - endMinutes) / 60;

                parsedSelections.push({
                    date: element.date,
                    totalLengthInHours: totalLengthInHours,
                    totalLengthInMinutes: totalLengthInMinutes,
                    startHours: startHours,
                    startMinutes: startMinutes,
                    endHours: endHours,
                    endMinutes: endMinutes,
                });
            }
        }

        props.onChange(parsedSelections);
    }

    return (
        <div>
            <div className="flex justify-center py-3">
                <div className="w-[70px] bg-transparent text-transparent">
                    &nbsp;
                    {/* Reserve space for the axis for overflow-scroll - the axis is absolute and doesn't register on the page */}
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center w-full px-3">
                        <Button
                            variant="outline"
                            className="p-[2px] h-fit"
                            onClick={() => {
                                setWeekOffset(weekOffset - 1);
                            }}
                        >
                            <ChevronLeft size={20} strokeWidth={0.75} />
                        </Button>
                        <div className="grow text-center">
                            <div className="text-sm font-semibold">
                                {`${format(startOfWeek, "do MMM y")} - ${format(
                                    endOfWeek,
                                    "do MMM y"
                                )}`}
                            </div>
                            <div className="text-xs font-light">
                                {displayRelativeWeeks()}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="p-[2px] h-fit"
                            onClick={() => {
                                setWeekOffset(weekOffset + 1);
                            }}
                        >
                            <ChevronRight size={20} strokeWidth={0.75} />
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {eachDayOfInterval({
                            start: startOfWeek,
                            end: endOfWeek,
                        }).map((date) => {
                            return (
                                <div
                                    key={"label" + date.toISOString()}
                                    className="w-[70px]"
                                >
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">
                                            {format(date, "iii")}
                                        </div>
                                        <div
                                            className={cn(
                                                "text-xs text-foreground",
                                                isToday(date)
                                                    ? "font-semibold"
                                                    : ""
                                            )}
                                        >
                                            {isToday(date)
                                                ? "Today"
                                                : format(date, "d MMM")}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative flex gap-2">
                        <div className="absolute top-0 left-[-70px] w-[70px]">
                            <TimeslotAxis
                                intervalSize={timeslotSize}
                                maxHeight={maxTimeslotHeight}
                            />
                        </div>

                        {eachDayOfInterval({
                            start: startOfWeek,
                            end: endOfWeek,
                        }).map((date) => {
                            /* Find if existing selection was made */
                            let index = findDateInArray(
                                date,
                                selections.current
                            );
                            let prevSelection = null;
                            if (index != -1) {
                                prevSelection =
                                    selections.current[index].selection;
                            }

                            return (
                                <div
                                    key={"timeslots" + date.toISOString()}
                                    className="w-[70px]"
                                >
                                    <TimeslotDay
                                        dayOfWeek={daysOfWeek[date.getDay()]}
                                        date={date}
                                        key={date}
                                        isToday={datesAreOnSameDay(today, date)}
                                        onChange={handleOnChange}
                                        prevSelection={prevSelection}
                                        intervalSize={timeslotSize}
                                        maxHeight={maxTimeslotHeight}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TimeslotPicker;
