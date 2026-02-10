import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ColourPicker({
  colour,
  onChange,
  asChild = true,
  className,
}: {
  colour: string;
  onChange: (value: string) => void;
  asChild?: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>
        <Button type="button" className={cn("w-8 h-8", className)} style={{ backgroundColor: colour }} />
      </PopoverTrigger>
      <PopoverContent className="w-fit grid gap-2 p-2" align="start" side={"top"}>
        <HexColorPicker color={colour} onChange={onChange} className="p-0 m-0" />
        <div className="border w-[92px] inline-flex items-center">
          <Input
            value={colour.slice(1).toUpperCase()}
            onChange={(e) => onChange(`#${e.target.value}`)}
            spellCheck={false}
            className="flex-1 border-transparent h-fit pl-0 mx-0"
            maxLength={6}
            showCounter={false}
            showHashPrefix
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
