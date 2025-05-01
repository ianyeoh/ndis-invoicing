"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { CommandList } from "cmdk";
import uniqolor from "uniqolor";

export type NDISComboboxList = { value: string; label: string }[];

export function NDISCodeCombobox({
    list,
    value,
    className,
    onBtnMouseDown,
    onDropdownMouseDown,
    onValueChange,
}: {
    list: NDISComboboxList;
    value: string;
    className?: string;
    onBtnMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onDropdownMouseDown?: React.MouseEventHandler<HTMLDivElement>;
    onValueChange: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [open, setOpen] = React.useState(false);
    const itemName = "code";

    function displayCode(itemValue: string) {
        const code = list.find((item) => item.value === itemValue);

        if (!code) {
            return;
        }

        const { value, label } = code;

        return (
            <>
                {`${label} (${value})`}
                <div
                    className="ml-5 h-[20px] min-w-[20px] rounded-full"
                    style={{
                        backgroundColor: uniqolor(value, {
                            lightness: 75,
                        }).color,
                    }}
                ></div>
            </>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("justify-between h-fit", className)}
                    onMouseDown={onBtnMouseDown}
                >
                    <div className="flex grow items-center w-[300px]">
                        <div className="flex w-[180px] grow text-wrap text-left text-xs items-center">
                            {value
                                ? displayCode(value)
                                : `Select ${itemName}...`}
                        </div>
                        <ChevronsUpDown className="w-[20px] ml-4 h-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${itemName}...`} />
                    <ScrollArea className="h-96">
                        <CommandEmpty>No {itemName} found.</CommandEmpty>
                        <CommandList>
                            <CommandGroup>
                                {list.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        value={`${item.label} (${item.value})`}
                                        onMouseDown={onDropdownMouseDown}
                                        onSelect={() => {
                                            onValueChange(
                                                item.value === value
                                                    ? ""
                                                    : item.value
                                            );
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-10",
                                                value === item.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {`${item.label} (${item.value})`}
                                        <div
                                            className="ml-5 h-[20px] min-w-[20px] rounded-full"
                                            style={{
                                                backgroundColor: uniqolor(
                                                    item.value,
                                                    {
                                                        lightness: 75,
                                                    }
                                                ).color,
                                            }}
                                        ></div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
