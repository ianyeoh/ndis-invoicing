"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Timeslot from "@/components/legacy-timeslot-picker/Timeslot";
import { T24toT12 } from "@/components/legacy-timeslot-picker/date-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function TimeslotDay(props) {
    const intervalSize = props.intervalSize;
    const numIntervals = (24 * 60) / intervalSize;
    const intervalsInOneHr = numIntervals / 24;
    const timeslotHeight = props.maxHeight / numIntervals;

    /* Boolean, tracks when the mouse is held down */
    const [mouseDown, setMouseDown] = useState(false);
    const [selectionToastId, setSelectionToastId] = useState(null);

    /*
     * Array that stores the selection state of each timeslot. A timeslot's selection state can
     * be accessed through the array access: selection[timeslot.getAttribute('data-index')].
     */
    const [selection, _setSelection] = useState(
        new Array(numIntervals).fill(false)
    );

    /*
     * Mutable ref to force state update, since we have an issue of stale states with the
     * onMouseUp handler... just React things
     */
    const selectionRef = useRef(selection);
    const setSelection = (data) => {
        selectionRef.current = data;
        _setSelection(data);
    };

    /*
     * Object that stores the parameters of the user's current selection. This could be a click
     * or a drag-select on one or more timeslots. The currentSelection is not applied to selection
     * until the user releases the mouse and triggers a mouse up event.
     */
    const [currentSelection, _setCurrentSelection] = useState(null);
    /* Again, ref to force update of stale states */
    const curSelectionRef = useRef(currentSelection);
    const setCurrentSelection = (data) => {
        curSelectionRef.current = data;
        _setCurrentSelection(data);
    };

    function displaySelectionToast({ start, end, state }) {
        return toast.message(state ? "Selecting" : "Deselecting", {
            id: selectionToastId ?? undefined,
            important: true,
            duration: Infinity,
            dismissible: false,
            description: `${
                start < end
                    ? T24toT12(
                          (start * intervalSize -
                              ((start * intervalSize) % 60)) /
                              60,
                          (start * intervalSize) % 60
                      ) +
                      "-" +
                      T24toT12(
                          ((end * 1 + 1) * intervalSize -
                              (((end * 1 + 1) * intervalSize) % 60)) /
                              60,
                          ((end * 1 + 1) * intervalSize) % 60
                      )
                    : T24toT12(
                          (end * intervalSize - ((end * intervalSize) % 60)) /
                              60,
                          (end * intervalSize) % 60
                      ) +
                      "-" +
                      T24toT12(
                          ((start * 1 + 1) * intervalSize -
                              (((start * 1 + 1) * intervalSize) % 60)) /
                              60,
                          ((start * 1 + 1) * intervalSize) % 60
                      )
            }, ${Math.abs((intervalSize * (end * 1 + 1 - start)) / 60)} hours`,
        });
    }

    useEffect(() => {
        /* Use previous selection if passed */
        if (props.prevSelection) {
            setSelection(props.prevSelection);
        }
    }, []);

    /*
     * Triggered when the user ends a click or drag-change on a timeslot
     */
    const handleMouseUp = () => {
        setMouseDown(false);

        let curSelection = curSelectionRef.current;
        let oldSelection = selectionRef.current;

        /* On drag-select end */
        if (curSelection) {
            let start = parseInt(curSelection.start);
            let end = parseInt(curSelection.end);

            if (end < start) {
                let temp = start;
                start = end;
                end = temp;
            }

            /* Apply curSelection */
            let newSelection = [...oldSelection];
            for (let i = start; i <= end; i++) {
                newSelection[i] = curSelection.state;
            }

            setSelection(newSelection);

            /* End the drag-change */
            setCurrentSelection(null);

            /* Update parent TimeslotPicker selection state */
            props.onChange({
                date: props.date,
                selection: newSelection,
            });
        }

        toast.dismiss(selectionToastId);
        setSelectionToastId(null);
    };

    /*
     * Triggered when the user presses mouse down to either click or drag-change on a timeslot.
     */
    const handleMouseDown = useCallback((event) => {
        /* To track drag-changes, keep a boolean of when the user presses mouse down */
        setMouseDown(true);

        /*
         * When the user presses down on a timeslot to perform a drag-select,
         * we want all of the selected timeslots to be set to the opposite of the timeslot
         * that was initially clicked, so we need to save the state of that timeslot.
         */
        let index = event.target.getAttribute("data-index");
        let isSelected = selectionRef.current[index];

        setCurrentSelection({
            start: index,
            end: index,
            state: !isSelected,
        });

        setSelectionToastId(
            displaySelectionToast({
                start: index,
                end: index,
                state: !isSelected,
            })
        );

        document.addEventListener("mouseup", handleMouseUp, { once: true });
    }, []);

    /*
     * Triggers on a drag-change. To track when the user is actually dragging (mouse down
     * triggered and held), rather than just hovering over, we only trigger a change if mouseDown is true.
     */
    function handleMouseEnter(event) {
        /* If a drag-select is currently being made */
        if (mouseDown && currentSelection) {
            let index = event.target.getAttribute("data-index");

            setCurrentSelection({
                ...currentSelection,
                end: index,
            });

            displaySelectionToast({
                ...currentSelection,
                end: index,
            });
        }
    }

    function isCurrentlySelected(index) {
        if (currentSelection) {
            let start = parseInt(currentSelection.start);
            let end = parseInt(currentSelection.end);

            if (end < start) {
                let temp = start;
                start = end;
                end = temp;
            }

            return index >= start && index <= end;
        }
        return false;
    }

    /* Create date string (i.e. 1 June) */
    const day = props.date.getDate();

    /*
     * Generate the timeslots for the day, there are numInterval timeslots in each hour, and thus
     * numInterval * 24 timeslots in each day. Each timeslot is assigned a sequential data-index
     * attribute which is used to track the selection state of the timeslot in the selection array.
     */
    let timeslotList = [];
    for (let hr = 0; hr < 24; hr++) {
        let hrList = [];
        for (let i = 0; i < intervalsInOneHr; i++) {
            let index = hr * intervalsInOneHr + i;
            hrList.push(
                <Timeslot
                    key={index}
                    data-day={day}
                    data-index={index}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    selected={selection[index]}
                    currentlyselected={isCurrentlySelected(index) ? 1 : 0}
                    selectedstate={
                        currentSelection && currentSelection.state ? 1 : 0
                    }
                    ishalfhr={((index + 1) * intervalSize) % 60 == 30 ? 1 : 0}
                    maxheight={timeslotHeight}
                />
            );
        }
        timeslotList.push(
            <div
                className={cn(
                    hr !== 23 ? "border-b border-solid border-border" : ""
                )}
                key={hr}
            >
                {hrList}
            </div>
        );
    }

    return (
        <div>
            <div className="border border-border">{timeslotList}</div>
        </div>
    );
}

export default TimeslotDay;
