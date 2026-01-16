const path = require("node:path");

module.exports = {
    apps: [
        {
            name: "sprint-backend",
            cwd: path.join(__dirname, "packages", "backend"),
            script: "bun",
            args: "dev",
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            autorestart: true,
            watch: false,
            restart_delay: 2000,
            max_restarts: 10,
            kill_timeout: 5000,
            time: true,
        },
        {
            name: "sprint-frontend",
            cwd: path.join(__dirname, "packages", "frontend"),
            script: "bun",
            args: "dev",
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            autorestart: true,
            watch: false,
            restart_delay: 2000,
            max_restarts: 10,
            kill_timeout: 5000,
            time: true,
        },
    ],
};
