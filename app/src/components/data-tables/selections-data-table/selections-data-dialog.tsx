import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useMemo } from "react";
import { groupContiguousTimeslots } from "@/lib/timesheet";
import { TimeslotColumn } from "@/components/timeslot-picker/timeslot-day-column";
import { timeslotSize } from "@/components/timeslot-picker/timeslot-picker";
import SelectionsDataTable from "./selections-data-table";
import { Day } from "date-fns";

export default function SelectionsDataDialog({
    open,
    onOpenChange,
    selections,
    weekStartsOn,
}: {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
    selections: {
        [weekOffset: number]: TimeslotColumn[];
    };
    weekStartsOn: Day;
}) {
    const groupedSelections = useMemo(() => {
        return groupContiguousTimeslots(
            selections,
            timeslotSize,
            weekStartsOn,
            true
        );
    }, [selections, timeslotSize]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] overflow-y-scroll min-w-[80vw] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Your selections</DialogTitle>
                    <DialogDescription>
                        View your selections here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <SelectionsDataTable selections={groupedSelections} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
