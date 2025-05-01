let hostURL = null;

if (typeof window !== "undefined") {
    hostURL = window.location.origin;
}

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const presetBaseRate = 65.47;
const presetModifiers = [
    /* Weekday evening (8PM-12PM) */
    {
        isSpecialRate: true,
        specialRate: 72.13,
        priority: 2,
        applyTo: {
            isDate: false,
            timeRange: ["20:00", "24:00"],
            weekdayRange: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            ],
        },
    },
    /* Weekday night (12AM to 6AM) */
    {
        isSpecialRate: true,
        specialRate: 73.46,
        priority: 2,
        applyTo: {
            isDate: false,
            timeRange: ["00:00", "06:00"],
            weekdayRange: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            ],
        },
    },
    /* Saturday (all-day) */
    {
        isSpecialRate: true,
        specialRate: 92.12,
        priority: 2,
        applyTo: {
            isDate: false,
            timeRange: ["00:00", "24:00"],
            weekdayRange: ["Saturday"],
        },
    },
    /* Sunday (all-day) */
    {
        isSpecialRate: true,
        specialRate: 118.78,
        priority: 2,
        applyTo: {
            isDate: false,
            timeRange: ["00:00", "24:00"],
            weekdayRange: ["Sunday"],
        },
    },
    /* Public holidays (all-day) */
    {
        isSpecialRate: true,
        specialRate: 145.44,
        priority: 1,
        applyTo: {
            isDate: false,
            timeRange: ["00:00", "24:00"],
            weekdayRange: ["Public Holidays"],
        },
    },
];

export { hostURL, months, daysOfWeek, presetBaseRate, presetModifiers };
