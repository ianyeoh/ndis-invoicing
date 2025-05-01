"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addWeeks } from "date-fns";
import { DateRangePicker } from "../ui/date-range-picker";
import { Textarea } from "../ui/textarea";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "../ui/spinners";
import { groupContiguousTimeslots } from "@/lib/timesheet";
import { TimeslotColumn } from "../timeslot-picker/timeslot-day-column";
import { timeslotSize } from "../timeslot-picker/timeslot-picker";
import {
    copyTemplateToSpreadsheet,
    flushDetailsToWorksheet,
    flushItemTotalsToWorksheet,
    flushTimesheetToWorksheet,
    renameWorksheet,
} from "../../lib/spreadsheets";
import {
    loadTemplates,
    templateSourceSpreadsheetId,
} from "../../lib/templates";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
type FormDefaultValues = {
    sheetTitle?: string;
    invoiceNum?: number;
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    from?: string;
    to?: string;
    notes?: string;
};
export default function SheetDetailsForm({
    spreadsheet,
    selection,
    defaultValues,
}: {
    spreadsheet: GoogleSpreadsheet;
    selection: {
        [weekOffset: number]: TimeslotColumn[];
    };
    defaultValues?: FormDefaultValues;
}) {
    const session = useSession();
    const [exportState, setExportState] = useState<
        "idle" | "exporting" | "done" | "error"
    >("idle");
    const [exportTooltip, setExportTooltip] = useState<string>("");

    const computedDefaultValues: FormDefaultValues = useMemo(() => {
        if (!defaultValues) {
            const computedValues: FormDefaultValues = {};

            /* Try and compute a date range from the user's selections */
            const timeSelections = groupContiguousTimeslots(
                selection,
                timeslotSize
            );

            if (timeSelections.length > 0) {
                const first = timeSelections[0];
                const last = timeSelections[timeSelections.length - 1];

                computedValues.dateRange = {
                    from: first.start,
                    to: last.end,
                };
            } else {
                toast.warning(
                    "You haven't selected any timeslots. If this was intentional, ignore this warning."
                );
            }

            /* Try and automatically compute invoice number from the user's worksheet titles */
            let highestNum = 1;
            const invoiceRegex = /^Invoice \d+$/gm;
            for (const title of Object.keys(spreadsheet.sheetsByTitle)) {
                if (invoiceRegex.test(title)) {
                    const invoiceNum = Number(title.split(" ")[1]);
                    if (!Number.isNaN(invoiceNum) && invoiceNum > highestNum) {
                        highestNum = invoiceNum;
                    }
                }
            }
            computedValues.invoiceNum = highestNum + 1;
            computedValues.sheetTitle = `Invoice ${highestNum + 1}`;

            /* Maybe add a way to set a default to, from and notes value */

            return computedValues;
        }

        return {};
    }, [defaultValues, selection]);

    const form = useForm<z.infer<typeof sheetDetailsSchema>>({
        resolver: zodResolver(sheetDetailsSchema),
        defaultValues: {
            sheetTitle: "Invoice 1",
            invoiceNum: 1,
            dateRange: {
                from: new Date(),
                to: addWeeks(new Date(), 1),
            },
            from: "",
            to: "",
            notes: "",
            ...defaultValues,
            ...computedDefaultValues,
        },
    });

    if (!session || !session.data) return;

    const token = session.data.access_token!;

    function onSubmit(values: z.infer<typeof sheetDetailsSchema>) {
        if (
            Object.keys(spreadsheet.sheetsByTitle).includes(values.sheetTitle)
        ) {
            toast.warning(
                "We've detected that the given worksheet title already exists in the spreadsheet. Please enter a unique worksheet title."
            );
            return;
        }

        return new Promise<void>(async (resolve, reject) => {
            try {
                setExportState("exporting");
                setExportTooltip("Fetching template");
                const templatesSpreadsheet = new GoogleSpreadsheet(
                    templateSourceSpreadsheetId,
                    { token }
                );
                await templatesSpreadsheet.loadInfo();
                const templates = await loadTemplates(templatesSpreadsheet);

                /* Temporary */
                const template = templates[0];

                setExportTooltip("Copying template invoice");
                await copyTemplateToSpreadsheet(
                    template,
                    spreadsheet.spreadsheetId
                );

                setExportTooltip("Checking copy successful");
                await spreadsheet.loadInfo();
                const sheetsByIndex = spreadsheet.sheetsByIndex;
                const newInvoiceSheet = sheetsByIndex[sheetsByIndex.length - 1];

                setExportTooltip("Renaming invoice worksheet");
                await renameWorksheet(newInvoiceSheet, values.sheetTitle);

                setExportTooltip("Writing invoice details to Google Sheets");
                await flushDetailsToWorksheet(
                    newInvoiceSheet,
                    template,
                    values
                );

                setExportTooltip("Processing your time selections");
                const timeSelections = groupContiguousTimeslots(
                    selection,
                    timeslotSize
                );

                setExportTooltip("Writing time selections to Google Sheets");
                await flushItemTotalsToWorksheet(
                    newInvoiceSheet,
                    template,
                    timeSelections
                );
                await flushTimesheetToWorksheet(
                    newInvoiceSheet,
                    template,
                    timeSelections
                );

                setExportTooltip("");
                setExportState("done");
                resolve();
            } catch (err) {
                toast.error(
                    `We ran into an error while exporting your sheet: ${
                        (err as Error).message
                    }`,
                    {
                        duration: Infinity,
                    }
                );
                setExportTooltip("");
                setExportState("error");
                reject((err as Error).message);
            }
        });
    }

    return (
        <>
            {!form.formState.isSubmitting && exportState === "idle" && (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <FormField
                            control={form.control}
                            name="sheetTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Worksheet title</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter new worksheet title"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This will be the title of the newly
                                        generated worksheet in your Google
                                        Sheet, and must be unique in your
                                        spreadsheet!
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="invoiceNum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice number</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter your invoice number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dateRange"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Invoice period</FormLabel>
                                    <DateRangePicker
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="from"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="About the sender (you)"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="float-right">
                                        Optional
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="About the recipient (them)"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="float-right">
                                        Optional
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any other relevant notes"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="float-right">
                                        Optional
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex pt-5">
                            <div className="grow"></div>
                            <Button type="submit">Export</Button>
                        </div>
                    </form>
                </Form>
            )}

            {form.formState.isSubmitting && (
                <div className="flex items-center justify-center gap-2">
                    {exportTooltip}
                    <LoadingSpinner />
                </div>
            )}

            {exportState === "done" && (
                <div className="flex items-center justify-center gap-4">
                    Timesheet exported successfully
                    <Button
                        onClick={() => {
                            window.open(
                                `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`
                            );
                        }}
                    >
                        Go to sheet
                    </Button>
                </div>
            )}

            {exportState === "error" && (
                <div className="flex items-center justify-center gap-4">
                    Something went wrong.
                    <Button
                        onClick={() => {
                            setExportState("idle");
                        }}
                    >
                        Try again
                    </Button>
                </div>
            )}
        </>
    );
}
