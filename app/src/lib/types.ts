/* Shared data types for the timeslot / timesheet domain.
 *
 * These live in lib (not the picker components) so pure logic modules
 * (timesheet, spreadsheets) can depend on them without importing React
 * component code. The picker components re-export these for their own use. */

import { NDISCode } from "@/lib/ndis-codes";

export type TimeslotState = {
    code: NDISCode | null;
};

export type TimeslotColumn = {
    // not the most memory efficient way to do this, since we store null values
    // but it's good enough for now. If greater space efficiency is needed, consider
    // only storing values that contain meaningful values
    timeslots: TimeslotState[];
};
