import "dotenv/config";
import pg from "pg";

const fallbackOrganisationIdArg = process.argv[2];
const fallbackOrganisationId = Number.parseInt(fallbackOrganisationIdArg ?? "", 10);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

if (!Number.isInteger(fallbackOrganisationId) || fallbackOrganisationId <= 0) {
    console.error("usage: bun scripts/backfill-timer-organisations.ts <fallback-organisation-id>");
    process.exit(1);
}

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();

    try {
        const organisationResult = await client.query('select id from "Organisation" where id = $1 limit 1', [
            fallbackOrganisationId,
        ]);

        if (organisationResult.rowCount === 0) {
            throw new Error(`organisation ${fallbackOrganisationId} does not exist`);
        }

        const issueTimersResult = await client.query(`
            update "TimedSession" as ts
            set "organisationId" = p."organisationId"
            from "Issue" as i
            inner join "Project" as p on p."id" = i."projectId"
            where ts."issueId" = i."id"
              and (
                ts."organisationId" is distinct from p."organisationId"
              )
            returning ts."id"
        `);

        const globalTimersResult = await client.query(
            `
                update "TimedSession"
                set "organisationId" = $1
                where "issueId" is null
                  and "organisationId" is null
                returning "id"
            `,
            [fallbackOrganisationId],
        );

        const remainingNullResult = await client.query(`
            select count(*)::int as count
            from "TimedSession"
            where "organisationId" is null
        `);

        console.log(
            JSON.stringify({
                fallbackOrganisationId,
                issueTimersUpdated: issueTimersResult.rowCount ?? 0,
                globalTimersUpdated: globalTimersResult.rowCount ?? 0,
                remainingNullOrganisationIds: remainingNullResult.rows[0]?.count ?? 0,
            }),
        );
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
