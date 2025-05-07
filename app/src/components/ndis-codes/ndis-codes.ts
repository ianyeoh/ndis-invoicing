import { timeslotSize } from "@/components/timeslot-picker/timeslot-picker";

export type DayTypes = "Weekday" | "Saturday" | "Sunday" | "Public Holiday";
export type TimeOfDayTypes = "Daytime" | "Evening" | "Night";

export const DayTypesList: DayTypes[] = [
    "Weekday",
    "Saturday",
    "Sunday",
    "Public Holiday",
];

export type NDISCode = {
    itemNumber: string;
    itemName: string;
    rates: {
        national: number;
        remote: number;
        veryRemote: number;
    };
    type: {
        day: DayTypes; // used to determine when applied
        time: TimeOfDayTypes | null; // display only, not used to determine code application
    };
    // either a set of start/end times, or a custom function that returns whether the code applies
    appliedTo: {
        start: number;
        end: number;
    };
    // | ((day: DayTypes, start: number, end: number) => boolean);
};

/*
 * Summary of times:
 *
 * Daytime    - 06:00 to 20:00
 * Evening    - 20:00 - 24:00
 * Night      - Starts before midnight and finishes after midnight (next day),
 *              or commences before 6:00AM on a weekday and finishes on the same weekday
 */
export const NDISCodes: NDISCode[] = [
    {
        itemNumber: "01_011_0107_1_1",
        itemName:
            "Assistance With Self-Care Activities - Standard - Weekday Daytime",
        rates: {
            national: 67.56,
            remote: 94.58,
            veryRemote: 101.34,
        },
        type: {
            day: "Weekday",
            time: "Daytime",
        },
        appliedTo: {
            start: totalMins(6, 0),
            end: totalMins(18, 0),
        },
    },
    {
        itemNumber: "01_015_0107_1_1",
        itemName:
            "Assistance With Self-Care Activities - Standard - Weekday Evening",
        rates: {
            national: 74.44,
            remote: 104.22,
            veryRemote: 111.66,
        },
        type: {
            day: "Weekday",
            time: "Evening",
        },
        appliedTo: {
            start: totalMins(18, 0),
            end: totalMins(24, 0),
        },
    },
    {
        itemNumber: "01_002_0107_1_1",
        itemName:
            "Assistance With Self-Care Activities - Standard - Weekday Night",
        rates: {
            national: 75.82,
            remote: 106.15,
            veryRemote: 113.73,
        },
        type: {
            day: "Weekday",
            time: "Night",
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(6, 0),
        },
    },
    {
        itemNumber: "01_013_0107_1_1",
        itemName: "Assistance With Self-Care Activities - Standard - Saturday",
        rates: {
            national: 95.07,
            remote: 133.1,
            veryRemote: 142.61,
        },
        type: {
            day: "Saturday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(24, 0),
        },
    },
    {
        itemNumber: "01_014_0107_1_1",
        itemName: "Assistance With Self-Care Activities - Standard - Sunday",
        rates: {
            national: 122.59,
            remote: 171.63,
            veryRemote: 183.89,
        },
        type: {
            day: "Sunday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(24, 0),
        },
    },
    {
        itemNumber: "01_012_0107_1_1",
        itemName:
            "Assistance With Self-Care Activities - Standard - Public Holiday",
        rates: {
            national: 150.1,
            remote: 210.14,
            veryRemote: 225.15,
        },
        type: {
            day: "Public Holiday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(24, 0),
        },
    },
    {
        itemNumber: "04_104_0125_6_1",
        itemName:
            "Access Community Social and Rec Activ - Standard - Weekday Daytime",
        rates: {
            national: 67.56,
            remote: 94.58,
            veryRemote: 101.34,
        },
        type: {
            day: "Weekday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(0, 0),
        },
    },
    {
        itemNumber: "04_103_0125_6_1",
        itemName:
            "Access Community Social and Rec Activ - Standard - Weekday Evening",
        rates: {
            national: 74.44,
            remote: 104.22,
            veryRemote: 111.66,
        },
        type: {
            day: "Weekday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(0, 0),
        },
    },
    {
        itemNumber: "04_105_0125_6_1",
        itemName: "Access Community Social and Rec Activ - Standard - Saturday",
        rates: {
            national: 95.07,
            remote: 133.1,
            veryRemote: 142.61,
        },
        type: {
            day: "Saturday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(0, 0),
        },
    },
    {
        itemNumber: "04_106_0125_6_1",
        itemName: "Access Community Social and Rec Activ - Standard - Sunday",
        rates: {
            national: 122.59,
            remote: 171.63,
            veryRemote: 183.89,
        },
        type: {
            day: "Sunday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(0, 0),
        },
    },
    {
        itemNumber: "04_102_0125_6_1",
        itemName:
            "Access Community Social and Rec Activ - Standard - Public Holiday",
        rates: {
            national: 150.1,
            remote: 210.14,
            veryRemote: 225.15,
        },
        type: {
            day: "Public Holiday",
            time: null,
        },
        appliedTo: {
            start: totalMins(0, 0),
            end: totalMins(0, 0),
        },
    },
];

export function getNDISCode(itemNumber: string): NDISCode | undefined {
    return NDISCodes.find((code) => code.itemNumber === itemNumber);
}

/*
 * Summary of times:
 *
 * Daytime    - 06:00 to 20:00
 * Evening    - 20:00 - 24:00
 * Night      - Starts before midnight and finishes after midnight (next day),
 *              or commences before 6:00AM on a weekday and finishes on the same weekday
 */

export type CodeSlotMapping = {
    codes: NDISCode[];
    isSplit: boolean;
};

export type CodeSlotMapType = {
    Weekday: CodeSlotMapping[];
    Saturday: CodeSlotMapping[];
    Sunday: CodeSlotMapping[];
    "Public Holiday": CodeSlotMapping[];
};

export const CodeSlotMap = {
    Weekday: genCodeMap("Weekday"),
    Saturday: genCodeMap("Saturday"),
    Sunday: genCodeMap("Sunday"),
    "Public Holiday": genCodeMap("Public Holiday"),
};

function timesAreOverlapping(
    // in total minutes
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
): boolean {
    if (aStart >= bStart && aEnd <= bEnd) {
        return true;
    } else if (aEnd <= bStart || aStart >= bEnd) {
        return false;
    }

    throw new Error("Split overlap.");
}

function totalMins(hours: number, minutes: number) {
    return hours * 60 + minutes;
}

// create numTimeslots number of CodeSlotMapping objects in an array
function genCodeMap(dayType: DayTypes) {
    const map: CodeSlotMapping[] = [];

    const numTimeslotsInADay = (24 * 60) / timeslotSize;

    for (let i = 0; i < numTimeslotsInADay; i++) {
        const start = i * timeslotSize; // in total mins
        const end = start + timeslotSize;

        // const startHr = Math.floor(numMinutes / 60);
        // const startMins = numMinutes % 60;
        // const endHr = startMins + timeslotSize > 60 ? startHr + 1 : startHr;
        // const endMins = (startMins + timeslotSize) % 60;

        // default
        map[i] = {
            codes: [],
            isSplit: false,
        };

        for (const code of NDISCodes) {
            if (code.type.day === dayType) {
                if (typeof code.appliedTo === "function") {
                    // if (code.appliedTo(dayType, start, end)) {
                    //     map[i].codes.push(code);
                    // }
                } else {
                    try {
                        if (
                            timesAreOverlapping(
                                start,
                                end,
                                code.appliedTo.start,
                                code.appliedTo.end
                            )
                        ) {
                            map[i].codes.push(code);
                        }
                    } catch {
                        map[i].isSplit = true;
                    }
                }
            }
        }
    }

    return map;
}
