/* Configurable constants for the timeslot picker.
 *
 * These live in lib (not the picker component) so pure logic and data
 * modules can depend on them without pulling in React component code. */

// in pixels, total height of the picker (ensure evenly divisible by 24 (hrs in a day))
export const maxPickerHeight = 840;

// in minutes, this is how much time a single timeslot represents
export const timeslotSize = 15;
