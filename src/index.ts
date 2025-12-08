import { db, testDB } from "./db/client";
import { User } from "./db/schema";
import { createUser, createIssue, createProject } from "./db/queries";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const createDemoData = async () => {
    const user = await createUser("Demo User", "demo_user");
    if (!user) {
        throw new Error("failed to create demo user");
    }

    const projectNames = ["PROJ", "TEST", "SAMPLE"];
    for (const name of projectNames) {
        const project = await createProject(name.slice(0, 4), name, user);

        for (let i = 1; i <= 5; i++) {
            await createIssue(
                project.id,
                `Issue ${i} in ${name}`,
                `This is a description for issue ${i} in ${name}.`,
            );
        }
    }
};

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": () => new Response(`title: eussi\ndev-mode: ${DEV}\nport: ${PORT}`),
        },
    });

    console.log(`eussi (issue server) listening on ${server.url}`);
    await testDB();

    let users = await db.select().from(User);

    if (DEV && users.length === 0) {
        console.log("creating demo data...");
        await createDemoData();
        console.log("demo data created");
        users = await db.select().from(User);
    }

    console.log(`serving ${users.length} user${users.length === 1 ? "" : "s"}`);
};

main();
