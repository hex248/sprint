import LogOutButton from "@/components/log-out-button";

function Account() {
    return (
        <main className="w-full h-[100vh] flex flex-col items-center justify-center gap-4 p-4">
            <h1 className="text-3xl font-bold">Account</h1>

            <p className="text-muted-foreground">Account page here</p>
            
            <LogOutButton />
        </main>
    );
}

export default Account;
