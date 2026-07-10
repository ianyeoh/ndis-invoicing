import { describe, expect, it } from "vitest";
import Holidays from "date-holidays";

/*
 * page.tsx's selectDayType uses date-holidays to return the "Public Holiday"
 * day type. selectDayType is a local (unexported) function, so it is not unit-
 * tested directly here - its integration is exercised through the page. These
 * tests instead pin the library wiring the page relies on: the same
 * AU/NSW/public configuration, proving a known public holiday is detected and
 * an ordinary weekday is not.
 */

describe("date-holidays wiring for public-holiday detection", () => {
    const holidays = new Holidays("AU", "NSW", { types: ["public"] });

    it("detects a known Australian public holiday", () => {
        // New Year's Day is a national public holiday.
        expect(holidays.isHoliday(new Date("2026-01-01T09:00:00"))).toBeTruthy();
    });

    it("does not flag an ordinary weekday", () => {
        // A mid-January Thursday with no public holiday.
        expect(holidays.isHoliday(new Date("2026-01-15T09:00:00"))).toBe(false);
    });
});
