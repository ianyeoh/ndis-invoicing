"use client";

import {
    CodeSlotMap,
    CodeSlotMapping,
    CodeSlotMapType,
    DayTypes,
    DayTypesList,
    NDISCode,
    NDISCodes,
} from "./ndis-codes";
import TimeslotAxis from "../timeslot-picker/timeslot-axis";
import {
    maxPickerHeight,
    timeslotSize,
} from "../timeslot-picker/timeslot-picker";
import { cn } from "@/lib/utils";
import uniqolor from "uniqolor";

function Timeslot({
    height,
    className,
    slot,
    colourCodes,
}: {
    height: number;
    className: string;
    slot: CodeSlotMapping;
    colourCodes: NDISCodeVisualised[];
}) {
    const { codes, isSplit } = slot;

    const wrongNumberOfCodes = codes.length !== 1;

    let bgColour = "#fc0303";

    if (!(wrongNumberOfCodes || isSplit)) {
        const { itemNumber } = codes[0];

        const code = colourCodes.find(
            (colourCode) => colourCode.itemNumber === itemNumber
        );

        if (code) {
            bgColour = code.colour;
        }
    }

    return (
        <div
            className={cn(className, bgColour)}
            style={{
                height,
                backgroundColor: bgColour,
            }}
        ></div>
    );
}

function DayTimeslotColumn({
    dayType,
    codes,
    codeSlotMap,
}: {
    dayType: DayTypes;
    codes: NDISCodeVisualised[];
    codeSlotMap: CodeSlotMapType;
}) {
    const daySlots = codeSlotMap[dayType];

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
            const index = hr * numTimeslotsIn1Hr + i;

            const slot = daySlots[index];

            timeslotsIn1Hr.push(
                <Timeslot
                    key={index}
                    height={timeslotHeight}
                    className={cn(
                        (i + 1) % numTimeslotsIn1Hr !== 0 && // is last slot for the hour
                            "border-b border-border/25"
                    )}
                    slot={slot}
                    colourCodes={codes}
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

interface NDISCodeVisualised extends NDISCode {
    colour: string;
}

export default function NDISCodeVisualiser() {
    const codes: NDISCodeVisualised[] = [];

    /* Add a unique colour to each code (this colour is seeded based on the code's itemNumber) */
    for (const code of NDISCodes) {
        const { color: colour } = uniqolor(code.itemNumber);
        codes.push({
            ...code,
            colour,
        });
    }

    return (
        <>
            <div className="w-[70px] bg-transparent text-transparent select-none">
                {/* Reserve space for the axis for overflow-scroll - the axis is absolute and doesn't register on the page */}
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                    {DayTypesList.map((type) => {
                        return (
                            <div
                                key={"label" + type}
                                className="w-[70px] flex items-end justify-center"
                            >
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">
                                        {type}
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

                    {DayTypesList.map((type) => {
                        return (
                            <div key={"timeslots" + type} className="w-[70px]">
                                <DayTimeslotColumn
                                    dayType={type}
                                    codes={codes}
                                    codeSlotMap={CodeSlotMap}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
