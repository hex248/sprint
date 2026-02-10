import type { SprintRecord } from "@sprint/shared";
import * as React from "react";
import { type DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  sprints,
  isEnd,
  currentSprint,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  sprints?: SprintRecord[];
  isEnd?: boolean;
  currentSprint?: { colour: string; startDate: Date; endDate: Date };
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px]",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute bg-popover inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn("select-none w-(--cell-size)", defaultClassNames.week_number_header),
        week_number: cn("text-[0.8rem] select-none text-muted-foreground", defaultClassNames.week_number),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day,
        ),
        range_start: cn("bg-accent", defaultClassNames.range_start),
        range_middle: cn(defaultClassNames.range_middle),
        range_end: cn("bg-accent", defaultClassNames.range_end),
        today: cn("border border-dashed -m-px", defaultClassNames.today),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <Icon icon="chevronLeftIcon" className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <Icon icon="chevronRightIcon" className={cn("size-4", className)} {...props} />;
          }

          return <Icon icon="chevronDownIcon" className={cn("size-4", className)} {...props} />;
        },
        DayButton: (props) => (
          <CalendarDayButton {...props} sprints={sprints} isEnd={isEnd} currentSprint={currentSprint} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export function CalendarDayButton({
  className,
  day,
  modifiers,
  sprints,
  style,
  disabled,
  isEnd,
  currentSprint,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  sprints?: SprintRecord[];
  isEnd?: boolean;
  currentSprint?: { colour: string; startDate: Date; endDate: Date };
}) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  let isDisabled = false;
  let sprint: SprintRecord | null = null;

  for (const entry of sprints || []) {
    if (day.date >= new Date(entry.startDate) && day.date <= new Date(entry.endDate)) {
      isDisabled = true;
      sprint = entry;
    }
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal",
        "[&>span]:text-xs [&>span]:opacity-70",
        !sprint?.color && "hover:bg-primary/90 hover:text-foreground",
        !currentSprint?.startDate &&
          "data-[selected-single=true]:!bg-foreground data-[selected-single=true]:!text-background data-[selected-single=true]:hover:!bg-foreground/90",
        "data-[range-start=true]:!bg-foreground data-[range-start=true]:!text-background",
        "data-[range-middle=true]:!bg-foreground data-[range-middle=true]:!text-background",
        "data-[range-end=true]:!bg-foreground data-[range-end=true]:!text-background",

        sprint?.color && "border-t border-b !border-(--sprint-color) !bg-(--sprint-color)/5",

        // part of new sprint
        currentSprint?.startDate &&
          currentSprint?.endDate &&
          day.date >= currentSprint?.startDate &&
          day.date <= currentSprint?.endDate &&
          "!border-t !border-b !border-(--current-sprint-color) !bg-(--current-sprint-color)/5 hover:!bg-(--current-sprint-color)/50 border-dashed",

        // is start of new sprint
        currentSprint?.startDate &&
          day.date.getDate() === currentSprint?.startDate.getDate() &&
          day.date.getMonth() === currentSprint?.startDate.getMonth() &&
          "!border-l !border-(--current-sprint-color)",

        // is start of new sprint
        currentSprint?.endDate &&
          day.date.getDate() === currentSprint?.endDate.getDate() &&
          day.date.getMonth() === currentSprint?.endDate.getMonth() &&
          "!border-r !border-(--current-sprint-color)",

        // is selected
        "data-[selected-single=true]:!bg-(--current-sprint-color)/75 data-[selected-single=true]:hover:!bg-(--current-sprint-color)/60",

        // is start and after end date (disable)
        !isEnd &&
          currentSprint?.endDate &&
          day.date > currentSprint?.endDate &&
          "opacity-50 pointer-events-none cursor-not-allowed",
        // isEnd and before start date (disable)
        isEnd &&
          currentSprint?.startDate &&
          day.date < currentSprint?.startDate &&
          "opacity-50 pointer-events-none cursor-not-allowed",

        defaultClassNames.day,
        className,
      )}
      style={
        {
          ...style,
          "--sprint-color": sprint?.color ? sprint.color : null,
          "--current-sprint-color": currentSprint?.colour ? currentSprint.colour : null,
          borderLeft:
            sprint && day.date.getUTCDate() === new Date(sprint.startDate).getUTCDate()
              ? `1px solid ${sprint?.color}`
              : day.date.getDay() === 0 // sunday (left side)
                ? `1px dashed ${sprint?.color}`
                : `0px`,
          borderRight:
            sprint && day.date.getUTCDate() === new Date(sprint.endDate).getUTCDate()
              ? `1px solid ${sprint?.color}`
              : day.date.getDay() === 6 // saturday (right side)
                ? `1px dashed ${sprint?.color}`
                : `0px`,
        } as React.CSSProperties
      }
      disabled={isDisabled || disabled}
      {...props}
    />
  );
}
