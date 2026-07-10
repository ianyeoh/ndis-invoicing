/* Validation schema + inferred type for the "export to Google Sheets" form.
 *
 * Kept in lib (not the form component) so pure logic modules such as
 * spreadsheets.ts can reference SheetDetailsType without importing the
 * React form component. The form re-exports both from here. */

import { z } from "zod";

export const sheetDetailsSchema = z
    .object({
        sheetTitle: z.string().min(2),
        invoiceNum: z.coerce.number().positive(),
        dateRange: z.object(
            {
                from: z.date(),
                to: z.date(),
            },
            {
                required_error: "Please select a date range.",
            }
        ),
        from: z.string().optional(),
        to: z.string().optional(),
        notes: z.string().optional(),
    })
    .refine((data) => data.dateRange.from < data.dateRange.to, {
        path: ["dateRange"],
        message: "Start date must be before end date.",
    });

export type SheetDetailsType = z.infer<typeof sheetDetailsSchema>;
