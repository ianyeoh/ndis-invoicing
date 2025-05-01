import { months, daysOfWeek } from "./constants";
import Holidays from "date-holidays";

var hd = new Holidays("AU", "nsw"); /* TODO: create a way to set region */

/* Collection of utils related to manipulating date */

/* Returns a copied Date object offset by the given number of days */
function addDays(date, days) {
    /* Copy date object */
    var newDate = new Date(date.getTime());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

/* Returns a copied Date object offset by the given number of weeks */
function addWeeks(date, weeks) {
    /* Copy date object */
    var newDate = new Date(date.getTime());
    newDate.setDate(newDate.getDate() + 7 * weeks);
    return newDate;
}

function getStartOfWeek(date) {
    var delta = -date.getDay()
    var startOfWeek = addDays(new Date(date.getTime()), delta);
    return startOfWeek;
}

function getEndOfWeek(date) {
    var delta = 6 - date.getDay()
    var endOfWeek = addDays(new Date(date.getTime()), delta);
    return endOfWeek;
}

/* Given a date object, returns the date as a string in format: DD Month YYYY */
function strFormatDate(d) {
    var date = d.getDate();
    var month = d.getMonth();
    var year = d.getFullYear();

    return (
        String(date).padStart(2, "0") +
        " " +
        months[month].slice(0, 3) +
        " " +
        year
    );
}

/* Convert 24hr time to 12hr time in format (HH:MM meridian) */
function T24toT12(hrs, mins) {
    var meridian = hrs >= 12 ? "PM" : "AM";
    return (
        (hrs % 12 || 12) +
        ":" +
        mins.toString().padStart(2, "0") +
        " " +
        meridian
    );
}

/* Given two days, returns true if both dates have the same date */
function datesAreOnSameDay(d1, d2) {
    return d1.toDateString() === d2.toDateString();
}

/* Given date number, return if date is in dayRange which is a list of weekday names */
function dayIsInDayRange(date, dayRange) {
    return dayRange.includes(daysOfWeek[date.getDay()]);
}

/*
 * Returns if the given date is a public holiday.
 * TODO: Need to extend functionality to support selectable regions and states
 */
function isPublicHoliday(date) {
    var isHoliday = hd.isHoliday(date);
    return isHoliday && isHoliday.type === "public";
}

function isAnyHoliday(date) {
    var holiday = hd.isHoliday(date);
    return holiday;
}

/*
 * Find an object in the array with the same date (searches object.date) as given
 * date Object. Returns index if found, -1 if not.
 */
function findDateInArray(date, array) {
    return array.findIndex((element) => datesAreOnSameDay(element.date, date));
}

function sortArrayOfDates(dateArray) {
    return dateArray.sort(function (a, b) {
        if (datesAreOnSameDay(a.date, b.date)) {
            return (
                a.startHours * 60 +
                a.startMinutes -
                (b.startHours * 60 + b.startMinutes)
            );
        } else {
            return a.date - b.date;
        }
    });
}

export {
    addDays,
    addWeeks,
    strFormatDate,
    T24toT12,
    getStartOfWeek,
    getEndOfWeek,
    datesAreOnSameDay,
    findDateInArray,
    dayIsInDayRange,
    isPublicHoliday,
    isAnyHoliday,
    sortArrayOfDates,
};
