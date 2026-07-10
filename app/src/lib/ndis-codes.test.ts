import {
    NDISCodes,
    getNDISCode,
    CodeSlotMap,
    DayTypesList,
    type DayTypes,
    type NDISCode,
} from "@/lib/ndis-codes";
import { timeslotSize } from "@/lib/constants";

// A day is divided into fixed-size timeslots. With a 15-minute slot size that
// is (24 * 60) / 15 = 96 slots. Slot i covers minutes [i*size, i*size+size).
const SLOTS_PER_DAY = (24 * 60) / timeslotSize;

// Convert a wall-clock hour to the slot index whose window starts at that hour.
// Only valid when the hour lands on a slot boundary (true for whole hours,
// since 60 is divisible by 15).
const slotAtHour = (hour: number) => (hour * 60) / timeslotSize;

// True when a slot contains a code with the given item number.
const slotHasCode = (
    slot: { codes: NDISCode[] },
    itemNumber: string
): boolean => slot.codes.some((code) => code.itemNumber === itemNumber);

describe("getNDISCode", () => {
    it("returns the matching code object for a real item number", () => {
        const code = getNDISCode("01_011_0107_1_1");
        expect(code).toBeDefined();
        expect(code?.itemNumber).toBe("01_011_0107_1_1");
        expect(code?.itemName).toBe(
            "Assistance With Self-Care Activities - Standard - Weekday Daytime"
        );
        expect(code?.rates.national).toBe(73.58);
        expect(code?.type.day).toBe("Weekday");
        expect(code?.type.time).toBe("Daytime");
    });

    it("returns undefined for an unknown item number", () => {
        expect(getNDISCode("does_not_exist")).toBeUndefined();
    });

    it("returns objects whose shape matches the NDISCode contract", () => {
        const code = getNDISCode("01_014_0107_1_1");
        expect(code).toBeDefined();
        // A positive national rate and a day-type drawn from the known list.
        expect(typeof code?.rates.national).toBe("number");
        expect(code!.rates.national).toBeGreaterThan(0);
        expect(DayTypesList).toContain(code!.type.day);
    });
});

describe("NDISCodes data set", () => {
    it("contains all catalog codes", () => {
        // Six standard "Assistance With Self-Care" codes plus five "Access
        // Community" codes = 11 entries in the current catalog.
        expect(NDISCodes).toHaveLength(11);
    });

    it("exposes the four known day types in order", () => {
        expect(DayTypesList).toEqual([
            "Weekday",
            "Saturday",
            "Sunday",
            "Public Holiday",
        ]);
    });
});

describe("CodeSlotMap structure", () => {
    it("has one slot per 15-minute window (96) for every day type", () => {
        for (const dayType of DayTypesList) {
            expect(CodeSlotMap[dayType]).toHaveLength(SLOTS_PER_DAY);
        }
    });

    it("gives every slot a codes array and an isSplit boolean", () => {
        for (const dayType of DayTypesList) {
            for (const slot of CodeSlotMap[dayType]) {
                expect(Array.isArray(slot.codes)).toBe(true);
                expect(typeof slot.isSplit).toBe("boolean");
            }
        }
    });
});

describe("CodeSlotMap Weekday window mapping", () => {
    const weekday = CodeSlotMap.Weekday;

    it("maps early-morning slots (00:00-06:00) to the Weekday Night code only", () => {
        // Night window is [00:00, 06:00) -> slot indices 0..23.
        for (let i = slotAtHour(0); i < slotAtHour(6); i++) {
            expect(weekday[i].codes).toHaveLength(1);
            expect(weekday[i].codes[0].itemNumber).toBe("01_002_0107_1_1");
        }
    });

    it("maps the daytime window (06:00-20:00) to the Weekday Daytime code only", () => {
        // Daytime window is [06:00, 20:00) -> slot indices 24..79.
        for (let i = slotAtHour(6); i < slotAtHour(20); i++) {
            expect(weekday[i].codes).toHaveLength(1);
            expect(weekday[i].codes[0].itemNumber).toBe("01_011_0107_1_1");
        }
    });

    it("maps the evening window (20:00-24:00) to the Weekday Evening code only", () => {
        // Evening window is [20:00, 24:00) -> slot indices 80..95.
        for (let i = slotAtHour(20); i < SLOTS_PER_DAY; i++) {
            expect(weekday[i].codes).toHaveLength(1);
            expect(weekday[i].codes[0].itemNumber).toBe("01_015_0107_1_1");
        }
    });

    it("puts a slot fully inside a single window into exactly that code", () => {
        // 03:00 sits well inside the Night window.
        const nightSlot = weekday[slotAtHour(3)];
        expect(nightSlot.codes).toHaveLength(1);
        expect(nightSlot.codes[0].itemNumber).toBe("01_002_0107_1_1");
    });
});

describe("CodeSlotMap whole-day day types", () => {
    // Saturday, Sunday and Public Holiday each have a single code spanning the
    // full day [00:00, 24:00), so every slot resolves to just that code.
    const wholeDayCode: Record<string, string> = {
        Saturday: "01_013_0107_1_1",
        Sunday: "01_014_0107_1_1",
        "Public Holiday": "01_012_0107_1_1",
    };

    for (const dayType of ["Saturday", "Sunday", "Public Holiday"] as const) {
        it(`maps every ${dayType} slot to its single full-day code`, () => {
            for (const slot of CodeSlotMap[dayType]) {
                expect(slot.codes).toHaveLength(1);
                expect(slot.codes[0].itemNumber).toBe(wholeDayCode[dayType]);
            }
        });
    }
});

describe("CodeSlotMap split handling", () => {
    // The overlap check throws "Split overlap." for a slot that only partially
    // covers a code window, which genCodeMap catches by setting isSplit=true.
    // With the current windows every boundary (06:00, 20:00, 24:00) falls on a
    // 15-minute slot edge, so no slot ever straddles a window at this
    // granularity. This test pins that: no split is produced today.
    it("produces no split slots for any day type at 15-minute granularity", () => {
        for (const dayType of DayTypesList) {
            for (const slot of CodeSlotMap[dayType]) {
                expect(slot.isSplit).toBe(false);
            }
        }
    });
});

describe("documented-behaviour tripwires", () => {
    // These tests lock in CURRENT behaviour so a later fix task has a tripwire.
    // They intentionally document what the code does today, not what NDIS rules
    // "should" be. Do not "fix" the code to make them pass differently without
    // deliberately updating these expectations.

    it("applies the daytime rate up to 20:00 and the evening rate from 20:00", () => {
        const weekday = CodeSlotMap.Weekday;
        const daytimeCode = "01_011_0107_1_1";
        const eveningCode = "01_015_0107_1_1";

        // 19:45 (the last slot before 20:00) is still daytime.
        const beforeBoundary = weekday[slotAtHour(20) - 1];
        expect(slotHasCode(beforeBoundary, daytimeCode)).toBe(true);

        // 20:00 is the first evening slot; daytime no longer applies.
        const atBoundary = weekday[slotAtHour(20)];
        expect(slotHasCode(atBoundary, daytimeCode)).toBe(false);
        expect(atBoundary.codes[0].itemNumber).toBe(eveningCode);
    });

    it("documents that 0,0-window codes are never auto-mapped", () => {
        // The four Access Community codes have appliedTo {start:0,end:0}, so
        // getNDISCode still finds them but they populate zero slots.
        const accessCommunity = "04_104_0125_6_1";
        expect(getNDISCode(accessCommunity)).toBeDefined();

        const appearances = CodeSlotMap.Weekday.filter((slot) =>
            slotHasCode(slot, accessCommunity)
        );
        expect(appearances).toHaveLength(0);
    });
});
