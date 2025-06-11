"use client";

import {
    startOfWeek as getStartOfWeek,
    endOfWeek as getEndOfWeek,
    addWeeks,
    format,
    eachDayOfInterval,
    isToday,
    getDay,
    StartOfWeekOptions,
    Day,
} from "date-fns";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useHotkeys } from "react-hotkeys-hook";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    DayTimeslotColumn,
    initialColumnState,
    TimeslotColumn,
} from "@/components/timeslot-picker/timeslot-day-column";
import TimeslotAxis from "@/components/timeslot-picker/timeslot-axis";
import "./drag-select-styling.css";

import { useDragSelect } from "../drag-select/drag-select";

/* Configurable constants */
export const maxPickerHeight = 840; // in pixels, total height of the picker (ensure evenly divisible by 24 (hrs in a day))
export const timeslotSize = 15; // in minutes, this is how much time a single timeslot represents

/* TimeslotPicker component state type */
export type TimeslotPickerState = {
    weekOffset: number;
    columns: {
        [weekOffset: number]: TimeslotColumn[];
    };
    selected: number[][]; // [dayIndex, slotIndex]
};

export const initialPickerState = (): TimeslotPickerState => {
    const timeslotColumns: TimeslotColumn[] = [];
    for (let i = 0; i <= 6; i++) {
        // for each day of the week
        timeslotColumns.push(initialColumnState());
    }

    return {
        weekOffset: 0,
        columns: {
            0: timeslotColumns,
        },
        selected: [],
    };
};

function TimeslotPickerUI({
    value,
    onValueChange,
    weekStartsOn,
}: {
    value: TimeslotPickerState;
    onValueChange: Dispatch<SetStateAction<TimeslotPickerState>>;
    weekStartsOn: Day;
}) {
    /* Configurable options */
    const weekOptions: StartOfWeekOptions = {
        weekStartsOn, // Monday (0 = Sunday, 1 = Monday, etc.)
    };

    /* Object destructuring state variable for cleaner code */
    const { weekOffset, columns } = value;

    /* Component setup */
    const today = new Date();
    const todayPlusOffset = addWeeks(today, weekOffset); // today + weekOffset number of weeks
    const startOfWeek = getStartOfWeek(todayPlusOffset, weekOptions);
    const endOfWeek = getEndOfWeek(todayPlusOffset, weekOptions);

    /* Register left and right arrow controls */
    useHotkeys("ArrowLeft", () => setWeekOffset(weekOffset - 1), [weekOffset]);
    useHotkeys("ArrowRight", () => setWeekOffset(weekOffset + 1), [weekOffset]);

    /* Drag select logic */
    const { dragSelect } = useDragSelect();

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

            onValueChange((prevState) => {
                return {
                    ...prevState,
                    selected: idxList,
                };
            });
        });

        return () => dragSelect.unsubscribe("DS:end", undefined, id!);
    }, [dragSelect]);

    /* Helper functions */
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

    function setWeekOffset(newOffset: number): void {
        dragSelect?.clearSelection();

        let newColumns = structuredClone(columns);
        if (!(newOffset in columns)) {
            // gen new day columns
            const timeslotColumns: TimeslotColumn[] = [];
            for (let i = 0; i <= 6; i++) {
                // for each day of the week
                timeslotColumns.push(initialColumnState());
            }

            newColumns[newOffset] = timeslotColumns;
        }

        onValueChange({
            ...value,
            weekOffset: newOffset,
            selected: [],
            columns: newColumns,
        });
    }

    return (
        <div className="flex justify-center select-none">
            <div className="w-[70px] bg-transparent text-transparent">
                {/* Reserve space for the axis for overflow-scroll - the axis is absolute and doesn't register on the page */}
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center w-full px-3">
                    <Button
                        variant="outline"
                        className="p-[2px] h-fit"
                        onClick={() => setWeekOffset(weekOffset - 1)}
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
                        onClick={() => setWeekOffset(weekOffset + 1)}
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
                                        className={`text-xs text-foreground ${
                                            isToday(date) && "font-semibold"
                                        }`}
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
                            maxHeight={maxPickerHeight}
                        />
                    </div>

                    {eachDayOfInterval({
                        start: startOfWeek,
                        end: endOfWeek,
                    }).map((date) => {
                        return (
                            <div
                                key={"timeslots" + date.toISOString()}
                                className="w-[70px]"
                            >
                                <DayTimeslotColumn
                                    day={date}
                                    index={getDay(date)}
                                    value={columns[weekOffset]}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function TimeslotPicker({
    ...props
}: {
    weekStartsOn: Day;
    value: TimeslotPickerState;
    onValueChange: Dispatch<SetStateAction<TimeslotPickerState>>;
}) {
    return (
        <div className="flex justify-center">
            <TimeslotPickerUI {...props} />
        </div>
    );
}
