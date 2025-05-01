import { NDISCode } from "@/components/ndis-codes/ndis-codes";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../data-table";
import { differenceInMinutes, format } from "date-fns";
import currency from "currency.js";

type Data = {
    code: NDISCode;
    start: Date;
    end: Date;
};

const columns: ColumnDef<Data>[] = [
    {
        accessorKey: "code",
        header: "Item Number",
        cell: ({ row }) => {
            const code: NDISCode = row.getValue("code");

            return code.itemNumber;
        },
    },
    {
        accessorKey: "start",
        header: "Start Time",
        cell: ({ row }) => {
            const start: Date = row.getValue("start");

            return format(start, "HH:mm dd LLL yyyy");
        },
    },
    {
        accessorKey: "end",
        header: "End Time",
        cell: ({ row }) => {
            const end: Date = row.getValue("end");

            return format(end, "HH:mm dd LLL yyyy");
        },
    },
    {
        accessorKey: "start",
        header: "Total Hours",
        cell: ({ row }) => {
            const start: Date = row.getValue("start");
            const end: Date = row.getValue("end");

            return currency(differenceInMinutes(end, start)).divide(60).value;
        },
    },
    {
        accessorKey: "code",
        header: "Total ($)",
        cell: ({ row }) => {
            const start: Date = row.getValue("start");
            const end: Date = row.getValue("end");
            const { rates }: NDISCode = row.getValue("code");
            const totalHours = currency(differenceInMinutes(end, start)).divide(
                60
            );

            return currency(rates.national).multiply(totalHours).value;
        },
    },
];

export default function SelectionsDataTable({
    selections,
}: {
    selections: Data[];
}) {
    let totalHours = currency(0);
    let grandTotal = currency(0);
    for (const { start, end, code } of selections) {
        const { rates } = code;

        const hours = currency(differenceInMinutes(end, start)).divide(60);
        const total = currency(rates.national).multiply(hours);

        totalHours = totalHours.add(hours);
        grandTotal = grandTotal.add(total);
    }

    return (
        <>
            <DataTable columns={columns} data={selections} />
            Totals:
            <div>{totalHours.value} hours</div>
            <div>${grandTotal.value}</div>
        </>
    );
}
