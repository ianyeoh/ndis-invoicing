import { describe, it, expect } from "vitest";
import { sheetDetailsSchema } from "@/lib/sheet-details.schema";

/*
 * Direct validation tests for the "export to Google Sheets" form schema.
 * These exercise the zod rules in isolation (no React, no form library) so
 * they are fast and immune to rendering flake. The form component delegates
 * all field validation to this schema via zodResolver, so covering it here
 * covers the form's validation contract.
 */
describe("sheetDetailsSchema", () => {
    // A fully valid input all optional-field tests can start from.
    const validInput = {
        sheetTitle: "Invoice 5",
        invoiceNum: 5,
        dateRange: {
            from: new Date("2026-01-01"),
            to: new Date("2026-02-01"),
        },
        from: "Sender details",
        to: "Recipient details",
        notes: "Some notes",
    };

    it("accepts a fully populated valid object", () => {
        const result = sheetDetailsSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("rejects a sheet title shorter than two characters", () => {
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            sheetTitle: "a",
        });
        expect(result.success).toBe(false);
    });

    it("rejects an invoice number of zero", () => {
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            invoiceNum: 0,
        });
        expect(result.success).toBe(false);
    });

    it("rejects a negative invoice number", () => {
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            invoiceNum: -3,
        });
        expect(result.success).toBe(false);
    });

    it("coerces a numeric string invoice number to a number", () => {
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            invoiceNum: "7",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            // z.coerce.number() should convert the string to a real number.
            expect(result.data.invoiceNum).toBe(7);
        }
    });

    it("fails the refinement when the start date is after the end date", () => {
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            dateRange: {
                from: new Date("2026-03-01"),
                to: new Date("2026-02-01"),
            },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues[0];
            expect(issue.path).toEqual(["dateRange"]);
            expect(issue.message).toBe("Start date must be before end date.");
        }
    });

    it("fails the refinement when the start date equals the end date", () => {
        const sameDate = new Date("2026-02-01");
        const result = sheetDetailsSchema.safeParse({
            ...validInput,
            dateRange: { from: sameDate, to: new Date("2026-02-01") },
        });
        // The refinement requires from < to strictly, so equal dates fail.
        expect(result.success).toBe(false);
    });

    it("allows the optional from, to and notes fields to be omitted", () => {
        const result = sheetDetailsSchema.safeParse({
            sheetTitle: "Invoice 5",
            invoiceNum: 5,
            dateRange: {
                from: new Date("2026-01-01"),
                to: new Date("2026-02-01"),
            },
        });
        expect(result.success).toBe(true);
    });
});
