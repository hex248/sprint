import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogOutButton() {
    const logOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <Button onClick={logOut} variant={"destructive"} className="flex gap-2 items-center">
            Log out
            <LogOut size={15} />
        </Button>
    );
}
