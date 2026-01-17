import { useState } from "react";
import LogOutButton from "@/components/log-out-button";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import ColourPicker from "@/components/ui/colour-picker";
import Icon, { iconNames, iconStyles } from "@/components/ui/icon";

function Test() {
    const [colour, setColour] = useState("#e05656");

    return (
        <main className="w-full min-h-[100vh] flex justify-center items-center gap-32 p-4">
            <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-muted-foreground">Other test components</p>
                <div className="flex gap-4">
                    <Button linkTo="/">go back to "/"</Button>
                </div>
                <LogOutButton />
                <ColourPicker colour={colour} onChange={setColour} />

                <ThemeToggle />
            </div>

            <div>
                <h1 className="text-2xl font-bold">Icon Demo</h1>
                <p className="text-muted-foreground">
                    All {iconNames.length} icons across {iconStyles.length} styles
                </p>

                <div className="overflow-x-auto">
                    <table className="border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2 font-medium">Name</th>
                                {iconStyles.map((iconStyle) => (
                                    <th key={iconStyle} className="text-center p-2 font-medium capitalize">
                                        {iconStyle}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {iconNames.map((name) => (
                                <tr key={name} className="border-b hover:bg-muted/50">
                                    <td className="font-mono text-sm pl-2 pr-12">{name}</td>
                                    {iconStyles.map((iconStyle) => (
                                        <td key={iconStyle} className="p-2 text-center">
                                            <Icon icon={name} iconStyle={iconStyle} size={24} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

export default Test;
