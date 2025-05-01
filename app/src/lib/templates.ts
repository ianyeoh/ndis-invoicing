// This is the metadata that all template sheets should contain
// The values denote (in A1 Sheet notation), the location of which

import {
    GoogleSpreadsheet,
    GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { z } from "zod";
import A1 from "@flighter/a1-notation";

export const templateSourceSpreadsheetId =
    "1djMS9lIn835PTaxkdBJmViUTDhO5eAIrzuYcc3ixeOU";

const isValidA1 = (val: string) => {
    return A1.isValid(val);
};

// data should be entered into the sheet.
const SheetLocationMetadataSchema = z.object({
    invoicePeriod: z.string().min(1).refine(isValidA1, {
        message: "Not in valid A1 notation.",
    }),
    invoiceNum: z.string().min(1).refine(isValidA1, {
        message: "Not in valid A1 notation.",
    }),
    from: z.string().min(1).refine(isValidA1, {
        message: "Not in valid A1 notation.",
    }),
    to: z.string().min(1).refine(isValidA1, {
        message: "Not in valid A1 notation.",
    }),
    notes: z.string().min(1).refine(isValidA1, {
        message: "Not in valid A1 notation.",
    }),

    items_rowStart: z.coerce.number().positive(), // this denotes where the invoice items begins (row number)
    // Values below are the column numbers that exist in the row
    items_date: z.string().min(1),
    items_itemNumber: z.string().min(1),
    items_startTime: z.string().min(1),
    items_endTime: z.string().min(1),
    items_totalHours: z.string().min(1),
    items_hourlyRate: z.string().min(1),

    itemTotals_rowStart: z.coerce.number().positive(), // this denotes where the invoice items begins (row number)
    // Values below are the column numbers that exist in the row
    itemTotals_itemNumber: z.string().min(1),
    itemTotals_cost: z.string().min(1),
    itemTotals_totalHours: z.string().min(1),
});

export type SheetLocationMetadata = z.infer<typeof SheetLocationMetadataSchema>;

export type SheetTemplate = {
    title: string;
    template: GoogleSpreadsheetWorksheet;
    metadata: SheetLocationMetadata;
};

export async function loadTemplates(
    spreadsheet: GoogleSpreadsheet
): Promise<SheetTemplate[]> {
    const sheetTemplates: SheetTemplate[] = [];
    for (const [title, template] of Object.entries(spreadsheet.sheetsByTitle)) {
        if (!title.includes("Metadata")) {
            const metadata = await getTemplateMetadata(
                spreadsheet.sheetsByTitle,
                title
            );

            // sheets with invalid metadata are omitted
            if (metadata != null) {
                sheetTemplates.push({
                    title,
                    template,
                    metadata,
                });
            }
        }
    }

    return sheetTemplates;
}

async function getTemplateMetadata(
    spreadsheetsByTitle: Record<string, GoogleSpreadsheetWorksheet>,
    templateTitle: string
) {
    const metadataTitle = `${templateTitle}_Metadata`;
    const metadataSheet = spreadsheetsByTitle[metadataTitle];
    if (metadataSheet == null) {
        console.log(`Metadata sheet not found: ${metadataTitle}`);
        return null;
    }

    const rows = await metadataSheet.getRows();

    if (rows.length < 1) {
        console.log("Metadata rows not found");
        return null;
    }

    const metadata = rows[0].toObject();

    const { success, data, error } =
        SheetLocationMetadataSchema.safeParse(metadata);

    if (!success) {
        console.log(error.issues);
        return null;
    }
    return data;
}
