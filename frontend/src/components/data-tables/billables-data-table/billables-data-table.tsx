"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Billable, DailyBillables } from "@/app/(protected)/app/legacy/page";
import { ColumnDef } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, formatISO } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { T24toT12 } from "../../legacy-timeslot-picker/date-utils";
import { NDISCodeCombobox } from "@/components/ndis-codes/ndis-code-combobox";

export const columns: ColumnDef<DailyBillables>[] = [
    {
        accessorKey: "date",
        header: "Date",
    },
];

function BillableTableRow({
    date,
    billables,
    total,
}: {
    date: Date;
    billables: Billable[];
    total: number;
}) {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <Collapsible
            key={formatISO(date)}
            open={isOpen}
            onOpenChange={setIsOpen}
            asChild
        >
            <>
                <CollapsibleTrigger asChild>
                    <TableRow className="border-t">
                        <TableCell>{format(date, "E d LLL yyyy")}</TableCell>
                        <TableCell>
                            {billables.reduce(
                                (accumulator, { totalLengthInHours }) =>
                                    accumulator + totalLengthInHours,
                                0
                            )}
                        </TableCell>
                        <TableCell>{total}</TableCell>
                        <TableCell>
                            <div className="flex justify-end">
                                {isOpen ? (
                                    <ChevronDown size={22} strokeWidth={1} />
                                ) : (
                                    <ChevronRight size={22} strokeWidth={1} />
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <TableCell colSpan={4} className="p-0">
                        <Table className="bg-accent">
                            <TableHeader className="border-b">
                                <TableRow>
                                    <TableHead>NDIS Code</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Total ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billables.map((billable) => (
                                    <TableRow>
                                        <TableCell>
                                            <NDISCodeCombobox
                                                value=""
                                                onValueChange={() => {}}
                                                list={[]}
                                            />
                                        </TableCell>
                                        <TableCell>Value here</TableCell>
                                        <TableCell>
                                            {T24toT12(
                                                billable.startHours,
                                                billable.startMinutes
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {T24toT12(
                                                billable.endHours,
                                                billable.endMinutes
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {billable.totalLengthInHours}
                                        </TableCell>
                                        <TableCell>{billable.total}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableCell>
                </CollapsibleContent>
            </>
        </Collapsible>
    );
}

export default function BillablesDataTable({
    value,
    onChange,
}: {
    value: DailyBillables[] | undefined;
    onChange: Dispatch<SetStateAction<DailyBillables[] | undefined>>;
}) {
    if (value === undefined) {
        return;
    }

    const billablesByDay = value; // alias

    return (
        <div className="min-w-[400px] my-10">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Hours billed</TableHead>
                            <TableHead>Total billed ($)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {billablesByDay.map(({ date, billables, total }) => (
                            <BillableTableRow
                                date={date}
                                billables={billables}
                                total={total}
                            />
                        ))}

                        {billablesByDay.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="h-16 text-center"
                                >
                                    No selections.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
