import { createIssue, createProject, createUser } from "./db/queries";

export const createDemoData = async () => {
    const user = await createUser("Demo User", "demo_user");
    if (!user) {
        throw new Error("failed to create demo user");
    }

    const projectNames = ["PROJ", "TEST", "SAMPLE"];
    for (const name of projectNames) {
        const project = await createProject(name.slice(0, 4), name, user.id);
        if (!project) {
            throw new Error(`failed to create demo project: ${name}`);
        }

        for (let i = 1; i <= 5; i++) {
            await createIssue(
                project.id,
                `Issue ${i} in ${name}`,
                `This is a description for issue ${i} in ${name}.`,
            );
        }
    }
};
