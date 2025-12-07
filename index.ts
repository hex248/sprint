const DEV = process.argv.find(arg => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null
const PORT = process.argv.find(arg => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || "3500"

const server = Bun.serve({
    port: Number(PORT),
    routes: {
        "/": () => new Response(`eussi - dev mode: ${DEV}`),
    }
});

console.log(`eussi (issue server) listening on ${server.url}`);
