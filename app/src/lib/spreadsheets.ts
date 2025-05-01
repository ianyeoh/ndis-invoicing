import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { SheetTemplate } from "./templates";
import { SheetDetailsType } from "../components/forms/sheet-details-form";
import { differenceInMinutes, format } from "date-fns";
import { getNDISCode, NDISCode } from "../components/ndis-codes/ndis-codes";
import currency from "currency.js";

export async function copyTemplateToSpreadsheet(
    sheetTemplate: SheetTemplate,
    destinationSpreadsheetId: string
) {
    return sheetTemplate.template.copyToSpreadsheet(destinationSpreadsheetId);
}

export async function renameWorksheet(
    sheet: GoogleSpreadsheetWorksheet,
    newTitle: string
) {
    return sheet.updateProperties({
        title: newTitle,
    });
}

export async function flushDetailsToWorksheet(
    sheet: GoogleSpreadsheetWorksheet,
    template: SheetTemplate,
    details: SheetDetailsType
) {
    const { invoicePeriod, invoiceNum, from, to, notes } = template.metadata;
    await sheet.loadCells();

    sheet.getCellByA1(invoiceNum).value = details.invoiceNum;
    sheet.getCellByA1(invoicePeriod).value = `${format(
        details.dateRange.from,
        "dd/MM/yyyy"
    )} - ${format(details.dateRange.to, "dd/MM/yyyy")}`;

    if (details.from) {
        sheet.getCellByA1(from).value = details.from;
    }

    if (details.to) {
        sheet.getCellByA1(to).value = details.to;
    }

    if (details.notes) {
        sheet.getCellByA1(notes).value = details.notes;
    }

    await sheet.saveUpdatedCells();
}

export async function flushTimesheetToWorksheet(
    sheet: GoogleSpreadsheetWorksheet,
    template: SheetTemplate,
    timeSelections: {
        code: NDISCode;
        start: Date;
        end: Date;
    }[]
) {
    const {
        items_rowStart: rowStart,
        items_date: date,
        items_itemNumber: itemNumber,
        items_startTime: startTime,
        items_endTime: endTime,
        items_totalHours: totalHours,
        items_hourlyRate: hourlyRate,
    } = template.metadata;

    await sheet.loadCells();

    const numRowsToInsert = timeSelections.length - 1;
    if (numRowsToInsert > 0)
        await insertRows(sheet, rowStart, numRowsToInsert, true);

    let i = 0;
    for (const { code, start, end } of timeSelections) {
        const rowNumber = rowStart + i;

        const hoursWorked = currency(differenceInMinutes(end, start)).divide(
            60
        );

        sheet.getCellByA1(`${date}${rowNumber}`).value = format(
            start,
            "dd/MM/yyyy"
        );
        sheet.getCellByA1(`${itemNumber}${rowNumber}`).value = code.itemNumber;
        sheet.getCellByA1(`${startTime}${rowNumber}`).value = format(
            start,
            "HH:mm"
        );
        sheet.getCellByA1(`${endTime}${rowNumber}`).value = format(
            end,
            "HH:mm"
        );
        sheet.getCellByA1(`${totalHours}${rowNumber}`).value =
            hoursWorked.value;
        sheet.getCellByA1(`${hourlyRate}${rowNumber}`).value = currency(
            code.rates.national
        ).value;

        i++;
    }

    await sheet.saveUpdatedCells();
}

export async function flushItemTotalsToWorksheet(
    sheet: GoogleSpreadsheetWorksheet,
    template: SheetTemplate,
    timeSelections: {
        code: NDISCode;
        start: Date;
        end: Date;
    }[]
) {
    const {
        itemTotals_rowStart: rowStart,
        itemTotals_itemNumber: itemNumber,
        itemTotals_cost: cost,
        itemTotals_totalHours: hours,
    } = template.metadata;

    await sheet.loadCells();

    const hoursWorkedByCode: {
        [itemNumber: string]: currency;
    } = {};
    for (const { code, start, end } of timeSelections) {
        const hoursWorked = currency(differenceInMinutes(end, start)).divide(
            60
        );

        if (!(code.itemNumber in hoursWorkedByCode)) {
            hoursWorkedByCode[code.itemNumber] = currency(0);
        }
        hoursWorkedByCode[code.itemNumber] =
            hoursWorkedByCode[code.itemNumber].add(hoursWorked);
    }

    const numRowsToInsert = Object.entries(hoursWorkedByCode).length - 1;
    if (numRowsToInsert > 0)
        await insertRows(sheet, rowStart, numRowsToInsert, true);

    let i = 0;
    for (const [key, totalHours] of Object.entries(hoursWorkedByCode)) {
        const rowNumber = rowStart + i;

        sheet.getCellByA1(`${itemNumber}${rowNumber}`).value = key;
        sheet.getCellByA1(`${cost}${rowNumber}`).value =
            getNDISCode(key)?.rates.national;
        sheet.getCellByA1(`${hours}${rowNumber}`).value = totalHours.value;

        i++;
    }

    await sheet.saveUpdatedCells();
}

async function insertRows(
    sheet: GoogleSpreadsheetWorksheet,
    rowNumber: number,
    numRows: number,
    inherit: boolean = true
) {
    return sheet.insertDimension(
        "ROWS",
        {
            startIndex: rowNumber,
            endIndex: rowNumber + numRows,
        },
        inherit
    );
}
