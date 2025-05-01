"use client";

/* Convert 24hr time to 12hr time in format (HH:MM meridian) */
function T24toT12(hrs: number, mins: number) {
    let meridian = hrs >= 12 ? "PM" : "AM";
    return {
        time: (hrs % 12 || 12) + ":" + mins.toString().padStart(2, "0"),
        meridian,
    };
}

export default function TimeslotAxis({
    maxHeight, // in pixels
}: {
    intervalSize: number;
    maxHeight: number;
}) {
    const intervalHeight = maxHeight / 24; // height in pixels

    const listOfHours = [];
    for (let hr = 0; hr < 24 + 1; hr++) {
        const { time, meridian } = T24toT12(hr, 0);

        listOfHours.push(
            <div
                key={"axishr" + hr}
                style={{ height: intervalHeight + 1 }} // + 1 to offset added width of border
                className="relative"
            >
                <div className="flex absolute w-full top-[-8px] leading-[16px]">
                    <div className="text-xs">{`${time} ${meridian}`}</div>
                </div>
            </div>
        );
    }

    return <div>{listOfHours}</div>;
}
