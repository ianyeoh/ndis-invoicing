import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { differenceInMinutes } from "date-fns";

import { groupContiguousTimeslots } from "@/lib/timesheet";
import { timeslotSize } from "@/lib/constants";
import { NDISCode } from "@/lib/ndis-codes";
import { TimeslotColumn } from "@/lib/types";

/*
 * groupContiguousTimeslots walks a set of weeks, each week being 7 day-columns
 * (indexed by day-of-week: 0=Sunday .. 6=Saturday). Each day-column holds an
 * ordered list of fixed-length timeslots. Adjacent slots that carry the same
 * NDIS code form one contiguous block; a block ends when the code changes,
 * a slot is empty, or (by default) a new day begins.
 *
 * The function reads `new Date()` to anchor each week, so these tests freeze
 * the clock to a known Monday to keep week/day arithmetic predictable.
 */

// Iterate days starting on Monday, matching the app's week layout.
const WEEK_STARTS_ON = 1;
const SIZE = timeslotSize; // 15 minutes per slot
// Small day-columns keep fixtures readable; the function does not require a
// full 96-slot day.
const SLOTS_PER_DAY = 8;

// Day-of-week indices used by the fixtures (the array is indexed this way).
const SUNDAY = 0;
const MONDAY = 1;
const TUESDAY = 2;

/** Build a fake NDIS code; only itemNumber participates in grouping. */
function fakeCode(itemNumber: string): NDISCode {
    return {
        itemNumber,
        itemName: `Fake ${itemNumber}`,
        rates: { national: 10, remote: 20, veryRemote: 30 },
        type: { day: "Weekday", time: "Daytime" },
        appliedTo: { start: 0, end: 0 },
    };
}

/** A single week of 7 empty day-columns, each with SLOTS_PER_DAY null slots. */
function emptyWeek(): TimeslotColumn[] {
    return Array.from({ length: 7 }, () => ({
        timeslots: Array.from({ length: SLOTS_PER_DAY }, () => ({
            code: null as NDISCode | null,
        })),
    }));
}

/** Set the code on a specific [dayOfWeek][slot] cell. */
function setSlot(
    week: TimeslotColumn[],
    dayOfWeek: number,
    slot: number,
    code: NDISCode
) {
    week[dayOfWeek].timeslots[slot].code = code;
}

const codeA = fakeCode("AAA");
const codeB = fakeCode("BBB");

describe("groupContiguousTimeslots", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // A Monday, so week/day math is stable across runs.
        vi.setSystemTime(new Date("2026-03-02T00:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns no blocks when every slot is empty", () => {
        const blocks = groupContiguousTimeslots(
            { 0: emptyWeek() },
            SIZE,
            WEEK_STARTS_ON
        );
        expect(blocks).toEqual([]);
    });

    it("groups a run of same-code slots in one day into a single block", () => {
        const week = emptyWeek();
        // Three contiguous slots of the same code on Monday.
        setSlot(week, MONDAY, 2, codeA);
        setSlot(week, MONDAY, 3, codeA);
        setSlot(week, MONDAY, 4, codeA);

        const blocks = groupContiguousTimeslots(
            { 0: week },
            SIZE,
            WEEK_STARTS_ON
        );

        expect(blocks).toHaveLength(1);
        expect(blocks[0].code.itemNumber).toBe("AAA");
        expect(blocks[0].start.getTime()).toBeLessThan(blocks[0].end.getTime());
        // Slots 2,3,4 are covered; the block closes at the start of slot 5,
        // so the span is three slots long.
        expect(differenceInMinutes(blocks[0].end, blocks[0].start)).toBe(
            3 * SIZE
        );
    });

    it("splits two different codes that are directly adjacent", () => {
        const week = emptyWeek();
        setSlot(week, MONDAY, 2, codeA);
        setSlot(week, MONDAY, 3, codeA);
        setSlot(week, MONDAY, 4, codeB);
        setSlot(week, MONDAY, 5, codeB);

        const blocks = groupContiguousTimeslots(
            { 0: week },
            SIZE,
            WEEK_STARTS_ON
        );

        expect(blocks).toHaveLength(2);
        expect(blocks.map((b) => b.code.itemNumber)).toEqual(["AAA", "BBB"]);
        expect(differenceInMinutes(blocks[0].end, blocks[0].start)).toBe(
            2 * SIZE
        );
        expect(differenceInMinutes(blocks[1].end, blocks[1].start)).toBe(
            2 * SIZE
        );
    });

    it("splits the same code into two blocks when a null gap separates them", () => {
        const week = emptyWeek();
        setSlot(week, MONDAY, 1, codeA);
        setSlot(week, MONDAY, 2, codeA);
        // slot 3 left empty
        setSlot(week, MONDAY, 4, codeA);
        setSlot(week, MONDAY, 5, codeA);

        const blocks = groupContiguousTimeslots(
            { 0: week },
            SIZE,
            WEEK_STARTS_ON
        );

        expect(blocks).toHaveLength(2);
        expect(blocks.every((b) => b.code.itemNumber === "AAA")).toBe(true);
        expect(differenceInMinutes(blocks[0].end, blocks[0].start)).toBe(
            2 * SIZE
        );
        expect(differenceInMinutes(blocks[1].end, blocks[1].start)).toBe(
            2 * SIZE
        );
    });

    describe("day boundaries", () => {
        // A run of the same code spanning the end of Monday into the start of
        // Tuesday, with no gap.
        function buildCrossDayWeek(): TimeslotColumn[] {
            const week = emptyWeek();
            setSlot(week, MONDAY, SLOTS_PER_DAY - 2, codeA);
            setSlot(week, MONDAY, SLOTS_PER_DAY - 1, codeA);
            setSlot(week, TUESDAY, 0, codeA);
            setSlot(week, TUESDAY, 1, codeA);
            return week;
        }

        it("breaks a run at the day boundary when breakOnDay is true (default)", () => {
            const blocks = groupContiguousTimeslots(
                { 0: buildCrossDayWeek() },
                SIZE,
                WEEK_STARTS_ON
            );

            expect(blocks).toHaveLength(2);
            expect(blocks.every((b) => b.code.itemNumber === "AAA")).toBe(true);
            for (const b of blocks) {
                expect(b.start.getTime()).toBeLessThan(b.end.getTime());
            }
            // The first block ends at the start of Tuesday; the second begins
            // there, so the boundary falls on the same instant.
            expect(blocks[0].end.getTime()).toBe(blocks[1].start.getTime());
        });

        it("keeps a run intact across the day boundary when breakOnDay is false", () => {
            const blocks = groupContiguousTimeslots(
                { 0: buildCrossDayWeek() },
                SIZE,
                WEEK_STARTS_ON,
                false
            );

            expect(blocks).toHaveLength(1);
            expect(blocks[0].code.itemNumber).toBe("AAA");
            expect(blocks[0].start.getTime()).toBeLessThan(
                blocks[0].end.getTime()
            );
            // The single block spans more than one slot (it crosses midnight),
            // so its duration exceeds a single timeslot.
            expect(
                differenceInMinutes(blocks[0].end, blocks[0].start)
            ).toBeGreaterThan(SIZE);
        });
    });

    describe("trailing open block flushed after the final day", () => {
        // With weekStartsOn = Monday, the last day iterated is Sunday, so a run
        // that reaches the end of Sunday is closed by the post-loop flush.
        it("flushes a single trailing slot as one timeslot", () => {
            const week = emptyWeek();
            setSlot(week, SUNDAY, SLOTS_PER_DAY - 1, codeA);

            const blocks = groupContiguousTimeslots(
                { 0: week },
                SIZE,
                WEEK_STARTS_ON
            );

            expect(blocks).toHaveLength(1);
            expect(blocks[0].code.itemNumber).toBe("AAA");
            // The trailing flush sets end = start + one timeslot.
            expect(differenceInMinutes(blocks[0].end, blocks[0].start)).toBe(
                SIZE
            );
        });

        it("flushes a multi-slot trailing run with its full duration", () => {
            const week = emptyWeek();
            // Two contiguous slots at the end of the final day.
            setSlot(week, SUNDAY, SLOTS_PER_DAY - 2, codeA);
            setSlot(week, SUNDAY, SLOTS_PER_DAY - 1, codeA);

            const blocks = groupContiguousTimeslots(
                { 0: week },
                SIZE,
                WEEK_STARTS_ON
            );

            expect(blocks).toHaveLength(1);
            expect(blocks[0].code.itemNumber).toBe("AAA");
            // Both slots belong to the block, so the post-loop flush records the
            // full two-slot span rather than truncating to a single timeslot.
            expect(differenceInMinutes(blocks[0].end, blocks[0].start)).toBe(
                2 * SIZE
            );
        });
    });

    it("produces blocks in every week when multiple week offsets are supplied", () => {
        const weekZero = emptyWeek();
        setSlot(weekZero, MONDAY, 2, codeA);
        setSlot(weekZero, MONDAY, 3, codeA);

        const weekOne = emptyWeek();
        setSlot(weekOne, MONDAY, 2, codeA);
        setSlot(weekOne, MONDAY, 3, codeA);

        const blocks = groupContiguousTimeslots(
            { 0: weekZero, 1: weekOne },
            SIZE,
            WEEK_STARTS_ON
        );

        expect(blocks).toHaveLength(2);
        expect(blocks.every((b) => b.code.itemNumber === "AAA")).toBe(true);
        // The second week's block starts exactly one week (7 days) after the
        // first week's block.
        expect(
            differenceInMinutes(blocks[1].start, blocks[0].start)
        ).toBe(7 * 24 * 60);
    });
});
