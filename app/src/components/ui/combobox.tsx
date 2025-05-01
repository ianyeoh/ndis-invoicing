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
import { CommandList } from "cmdk";

export type ComboboxList = { value: string; label: string }[];

export function Combobox({
    list,
    itemName,
    value,
    className,
    onBtnMouseDown,
    onDropdownMouseDown,
    onValueChange,
}: {
    list: ComboboxList;
    itemName: string;
    value: string;
    className?: string;
    onBtnMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onDropdownMouseDown?: React.MouseEventHandler<HTMLDivElement>;
    onValueChange: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [open, setOpen] = React.useState(false);

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
                        <div className="w-[190px] text-wrap text-left text-xs">
                            {value
                                ? list.find((item) => item.value === value)
                                      ?.label
                                : `Select ${itemName}...`}
                        </div>
                        <div className="grow"></div>
                        <ChevronsUpDown className="w-[20px] h-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${itemName}...`} />
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
                                            "mr-2 h-4 w-4",
                                            value === item.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {`${item.label} (${item.value})`}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
