import { Link } from "react-router-dom";

function Organisations() {
    return (
        <main className="w-full h-[100vh] flex flex-col items-start gap-4 p-4">
            <h1 className="text-3xl font-600">Organisations</h1>

            <p className="text-muted-foreground">Organisations page here</p>

            <Link to="/" className="">
                Go to Home
            </Link>
        </main>
    );
}

export default Organisations;
