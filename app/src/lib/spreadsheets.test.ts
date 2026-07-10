import { describe, expect, it, vi } from "vitest";
import type { GoogleSpreadsheetWorksheet } from "google-spreadsheet";

import {
    flushDetailsToWorksheet,
    flushItemTotalsToWorksheet,
    flushTimesheetToWorksheet,
} from "@/lib/spreadsheets";
import { getNDISCode, NDISCode } from "@/lib/ndis-codes";
import { SheetLocationMetadata, SheetTemplate } from "@/lib/templates";
import { SheetDetailsType } from "@/lib/sheet-details.schema";

/*
 * These functions write invoice data into a Google Sheets worksheet. The real
 * worksheet talks to the network, so each test swaps in a fake worksheet that
 * records every cell write by its A1 address. That lets the tests assert both
 * WHAT was written and WHERE, without any live spreadsheet.
 */

/**
 * A fake worksheet. `getCellByA1` hands back a lazily created cell object per
 * address, so a test can read `cells["B5"].value` to see what was written. The
 * network-facing methods are spies that record calls but do nothing.
 */
function makeFakeSheet() {
    const cells: Record<string, { value: unknown }> = {};
    const sheet = {
        loadCells: vi.fn(),
        saveUpdatedCells: vi.fn(),
        insertDimension: vi.fn(),
        getCellByA1: vi.fn(
            (a1: string) => (cells[a1] ??= { value: undefined })
        ),
    };
    return { sheet, cells };
}

/** Cast the fake to the worksheet type the flush functions expect. */
function asWorksheet(sheet: unknown): GoogleSpreadsheetWorksheet {
    return sheet as unknown as GoogleSpreadsheetWorksheet;
}

// Hand-written A1 layout for a fake template. Detail cells, invoice-item rows,
// and item-total rows all live at distinct addresses so writes never collide.
const metadata: SheetLocationMetadata = {
    invoiceNum: "B1",
    invoicePeriod: "B2",
    from: "B3",
    to: "B4",
    notes: "B5",

    items_rowStart: 5,
    items_date: "A",
    items_itemNumber: "B",
    items_startTime: "C",
    items_endTime: "D",
    items_totalHours: "E",
    items_hourlyRate: "F",

    itemTotals_rowStart: 20,
    itemTotals_itemNumber: "A",
    itemTotals_cost: "B",
    itemTotals_totalHours: "C",
};

const template: SheetTemplate = {
    title: "Fake Template",
    template: {} as GoogleSpreadsheetWorksheet,
    metadata,
};

// Real codes so aggregated costs use real national rates.
const WEEKDAY_DAYTIME = getNDISCode("01_011_0107_1_1")!; // national 73.58
const SATURDAY = getNDISCode("01_013_0107_1_1")!; // national 103.54

/** Build a time selection with the given code and start/end wall-clock times. */
function selection(code: NDISCode, startIso: string, endIso: string) {
    return { code, start: new Date(startIso), end: new Date(endIso) };
}

describe("flushDetailsToWorksheet", () => {
    it("writes the invoice number and a formatted invoice-period range", async () => {
        const { sheet, cells } = makeFakeSheet();
        const details: SheetDetailsType = {
            sheetTitle: "March invoice",
            invoiceNum: 42,
            dateRange: {
                from: new Date("2026-03-01T00:00:00"),
                to: new Date("2026-03-31T00:00:00"),
            },
        };

        await flushDetailsToWorksheet(asWorksheet(sheet), template, details);

        expect(cells["B1"].value).toBe(42);
        expect(cells["B2"].value).toBe("01/03/2026 - 31/03/2026");
        expect(sheet.saveUpdatedCells).toHaveBeenCalledTimes(1);
    });

    it("omits optional from/to/notes cells when those fields are absent", async () => {
        const { sheet, cells } = makeFakeSheet();
        const details: SheetDetailsType = {
            sheetTitle: "March invoice",
            invoiceNum: 42,
            dateRange: {
                from: new Date("2026-03-01T00:00:00"),
                to: new Date("2026-03-31T00:00:00"),
            },
        };

        await flushDetailsToWorksheet(asWorksheet(sheet), template, details);

        // Absent optional fields short-circuit before getCellByA1, so those
        // addresses are never even created.
        expect(cells["B3"]).toBeUndefined();
        expect(cells["B4"]).toBeUndefined();
        expect(cells["B5"]).toBeUndefined();
    });

    it("writes from/to/notes cells when those fields are provided", async () => {
        const { sheet, cells } = makeFakeSheet();
        const details: SheetDetailsType = {
            sheetTitle: "March invoice",
            invoiceNum: 7,
            dateRange: {
                from: new Date("2026-03-01T00:00:00"),
                to: new Date("2026-03-31T00:00:00"),
            },
            from: "Support Worker",
            to: "Participant",
            notes: "Weekly supports",
        };

        await flushDetailsToWorksheet(asWorksheet(sheet), template, details);

        expect(cells["B3"].value).toBe("Support Worker");
        expect(cells["B4"].value).toBe("Participant");
        expect(cells["B5"].value).toBe("Weekly supports");
    });
});

describe("flushTimesheetToWorksheet", () => {
    it("writes one row per selection at the right addresses and totals hours", async () => {
        const { sheet, cells } = makeFakeSheet();
        const selections = [
            // Exactly 90 minutes long -> 1.5 hours.
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:30:00"
            ),
            selection(
                SATURDAY,
                "2026-03-07T13:00:00",
                "2026-03-07T14:00:00"
            ),
        ];

        await flushTimesheetToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        // First row lands on items_rowStart (5).
        expect(cells["A5"].value).toBe("02/03/2026");
        expect(cells["B5"].value).toBe("01_011_0107_1_1");
        expect(cells["C5"].value).toBe("09:00");
        expect(cells["D5"].value).toBe("10:30");
        expect(cells["E5"].value).toBe(1.5);
        expect(cells["F5"].value).toBe(73.58);

        // Second row lands on the next row down (6).
        expect(cells["A6"].value).toBe("07/03/2026");
        expect(cells["B6"].value).toBe("01_013_0107_1_1");
        expect(cells["C6"].value).toBe("13:00");
        expect(cells["D6"].value).toBe("14:00");
        expect(cells["E6"].value).toBe(1);
        expect(cells["F6"].value).toBe(103.54);

        expect(sheet.saveUpdatedCells).toHaveBeenCalledTimes(1);
    });

    it("inserts rows for the extra selections beyond the first", async () => {
        const { sheet } = makeFakeSheet();
        const selections = [
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:00:00"
            ),
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-03T09:00:00",
                "2026-03-03T10:00:00"
            ),
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-04T09:00:00",
                "2026-03-04T10:00:00"
            ),
        ];

        await flushTimesheetToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        // Three selections need two extra rows inserted at the start row.
        expect(sheet.insertDimension).toHaveBeenCalledTimes(1);
        expect(sheet.insertDimension).toHaveBeenCalledWith(
            "ROWS",
            { startIndex: 5, endIndex: 7 },
            true
        );
    });

    it("does not insert any rows for a single selection", async () => {
        const { sheet } = makeFakeSheet();
        const selections = [
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:00:00"
            ),
        ];

        await flushTimesheetToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        expect(sheet.insertDimension).not.toHaveBeenCalled();
    });
});

describe("flushItemTotalsToWorksheet", () => {
    it("aggregates hours per distinct code and writes each code's national rate", async () => {
        const { sheet, cells } = makeFakeSheet();
        const selections = [
            // Weekday daytime: 1.5h + 1h = 2.5h total.
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:30:00"
            ),
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-03T09:00:00",
                "2026-03-03T10:00:00"
            ),
            // Saturday: 2h total.
            selection(
                SATURDAY,
                "2026-03-07T13:00:00",
                "2026-03-07T15:00:00"
            ),
        ];

        await flushItemTotalsToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        // First distinct code (weekday daytime) at the totals start row (20).
        expect(cells["A20"].value).toBe("01_011_0107_1_1");
        expect(cells["B20"].value).toBe(73.58);
        expect(cells["C20"].value).toBe(2.5);

        // Second distinct code (Saturday) on the next row.
        expect(cells["A21"].value).toBe("01_013_0107_1_1");
        expect(cells["B21"].value).toBe(103.54);
        expect(cells["C21"].value).toBe(2);

        expect(sheet.saveUpdatedCells).toHaveBeenCalledTimes(1);
    });

    it("inserts one extra row when there are two distinct codes", async () => {
        const { sheet } = makeFakeSheet();
        const selections = [
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:00:00"
            ),
            selection(
                SATURDAY,
                "2026-03-07T13:00:00",
                "2026-03-07T14:00:00"
            ),
        ];

        await flushItemTotalsToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        expect(sheet.insertDimension).toHaveBeenCalledTimes(1);
        expect(sheet.insertDimension).toHaveBeenCalledWith(
            "ROWS",
            { startIndex: 20, endIndex: 21 },
            true
        );
    });

    it("does not insert rows when every selection shares one code", async () => {
        const { sheet, cells } = makeFakeSheet();
        const selections = [
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-02T09:00:00",
                "2026-03-02T10:00:00"
            ),
            selection(
                WEEKDAY_DAYTIME,
                "2026-03-03T09:00:00",
                "2026-03-03T11:00:00"
            ),
        ];

        await flushItemTotalsToWorksheet(
            asWorksheet(sheet),
            template,
            selections
        );

        expect(sheet.insertDimension).not.toHaveBeenCalled();
        // Single aggregated row: 1h + 2h = 3h.
        expect(cells["A20"].value).toBe("01_011_0107_1_1");
        expect(cells["C20"].value).toBe(3);
    });
});
