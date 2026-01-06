import { hashPassword } from "./auth/utils";
import {
    createIssue,
    createOrganisation,
    createOrganisationMember,
    createProject,
    createUser,
} from "./db/queries";

export const createDemoData = async () => {
    const passwordHash = await hashPassword("a");

    // create two users
    const user1 = await createUser("test 1", "t1", passwordHash);
    if (!user1) {
        throw new Error("failed to create test 1");
    }

    const user2 = await createUser("test 2", "t2", passwordHash);
    if (!user2) {
        throw new Error("failed to create test 2");
    }

    // create four organisations
    const organisations = [];
    for (let i = 1; i <= 4; i++) {
        const org = await createOrganisation(
            `Demo Organisation ${i}`,
            `demo-org-${i}`,
            `A demo organisation ${i} for testing`,
        );
        if (!org) {
            throw new Error(`failed to create demo organisation ${i}`);
        }
        organisations.push(org);
    }

    // set up organisation memberships
    // user 1 owns: org 1, org 2; has access to: org 3
    // user 2 owns: org 3, org 4; has access to: org 2
    const org1 = organisations[0];
    const org2 = organisations[1];
    const org3 = organisations[2];
    const org4 = organisations[3];
    if (!org1 || !org2 || !org3 || !org4) {
        throw new Error("failed to create organisations");
    }

    // user 1 memberships
    await createOrganisationMember(org1.id, user1.id, "owner"); // owns org 1
    await createOrganisationMember(org2.id, user1.id, "owner"); // owns org 2
    await createOrganisationMember(org3.id, user1.id, "member"); // member of org 3

    // user 2 memberships
    await createOrganisationMember(org2.id, user2.id, "member"); // member of org 2
    await createOrganisationMember(org3.id, user2.id, "owner"); // owns org 3
    await createOrganisationMember(org4.id, user2.id, "owner"); // owns org 4

    // project names: AAAAA, BBBBB, CCCCC, DDDDD, EEEEE, FFFFF, GGGGG, HHHHH, IIIII, JJJJJ, KKKKK, LLLLL
    const projectNames = [
        "AAAAA",
        "BBBBB",
        "CCCCC",
        "DDDDD",
        "EEEEE",
        "FFFFF",
        "GGGGG",
        "HHHHH",
        "IIIII",
        "JJJJJ",
        "KKKKK",
        "LLLLL",
    ];

    // create 3 projects per organisation
    let projectIndex = 0;
    const orgConfigs = [
        { org: org1, creator: user1 }, // org 1: user1
        { org: org2, creator: user1 }, // org 2: user1
        { org: org3, creator: user2 }, // org 3: user2
        { org: org4, creator: user2 }, // org 4: user2
    ];

    for (const config of orgConfigs) {
        for (let projNum = 0; projNum < 3; projNum++) {
            const projectName = projectNames[projectIndex++];
            if (!projectName) {
                throw new Error("ran out of project names");
            }

            const project = await createProject(
                projectName.slice(0, 4),
                projectName,
                config.creator.id,
                config.org.id,
            );
            if (!project) {
                throw new Error(`failed to create demo project: ${projectName}`);
            }

            // create some issues for each project
            for (let i = 1; i <= 3; i++) {
                let assignee: number | undefined;

                // for crossover organizations (org2 and org3), randomly assign to either user
                if (config.org.id === org2.id || config.org.id === org3.id) {
                    // 40% chance to assign to creator, 40% chance to assign to other user, 20% chance unassigned
                    const rand = Math.random();
                    if (rand < 0.4) {
                        assignee = config.creator.id;
                    } else if (rand < 0.8) {
                        assignee = config.org.id === org2.id ? user2.id : user1.id; // other user
                    }
                    // else: undefined (unassigned)
                } else {
                    // for exclusive organizations (org1 and org4), assign to creator on even issues
                    assignee = i % 2 === 0 ? config.creator.id : undefined;
                }

                await createIssue(
                    project.id,
                    `Issue ${i} in ${projectName}`,
                    `This is a description for issue ${i} in ${projectName}.`,
                    config.creator.id,
                    assignee,
                );
            }
        }
    }
};
