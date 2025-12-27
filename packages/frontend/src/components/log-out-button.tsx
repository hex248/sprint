import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LogOutButton() {
    const navigate = useNavigate();

    const logOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate(0);
    };

    return (
        <Button onClick={logOut} variant={"destructive"} className="flex gap-2 items-center">
            Log out
            <LogOut size={15} />
        </Button>
    );
}
