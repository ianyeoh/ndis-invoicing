import { cn } from "@/lib/utils";

function Timeslot(props) {
    return (
        <div
            {...props}
            style={{ height: props.maxheight }}
            className={cn(
                "hover:bg-muted-foreground/40 touch-none select-none opacity-90", // default
                props.currentlyselected
                    ? props.selectedstate
                        ? "hover:bg-foreground/50 bg-foreground/50 opacity-100" // selecting
                        : "hover:bg-muted-foreground/30 bg-muted-foreground/30" // deselecting
                    : props.selected
                    ? "bg-foreground/40" // selected
                    : "bg-background/40", // not selected
                props.ishalfhr && "border-b border-dotted border-border"
            )}
            draggable={false}
        ></div>
    );
}

export default Timeslot;
