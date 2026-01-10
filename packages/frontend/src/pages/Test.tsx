import { useState } from "react";
import LogOutButton from "@/components/log-out-button";
import { Button } from "@/components/ui/button";
import ColourPicker from "@/components/ui/colour-picker";

function Test() {
    const [colour, setColour] = useState("#e05656");

    return (
        <main className="w-full h-[100vh] flex flex-col items-center justify-center gap-4 p-4">
            <h1 className="text-3xl font-bold">Test</h1>

            <p className="text-muted-foreground">Simple test page for demo</p>
            <div className="flex gap-4">
                <Button linkTo="/">go back to "/"</Button>
            </div>
            <LogOutButton />

            <ColourPicker colour={colour} onChange={setColour} />
        </main>
    );
}

export default Test;
