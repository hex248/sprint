#set page(margin: (top: 32pt, bottom: 36pt, left: 40pt, right: 40pt))
#set text(font: "IBM Plex Sans", size: 11pt)

= Sprint
== What is the value proposition?

Sprint is a fast, developer-first project management tool for indie teams who are tired of bloated, sluggish systems. It keeps the core workflow focused on issues, sprints, and time tracking while staying flexible enough to match how small teams actually work.

=== Who is this for?
- Indie developer teams of 2 to 10 people
- Teams that value speed, clarity, and control over customization bloat
- Teams that want self-hosting and ownership of their data

=== What problem does it solve?
- Traditional tools like Jira are slow, complex, and priced for enterprise
- Developer workflows are forced to fit non-technical assumptions
- Small teams need focus, not configuration overhead

=== What is the promise?
Sprint delivers the essential project workflow with a fast UI, flexible org settings, and developer-friendly integrations. It is intentionally small, configurable, and self-hostable.

=== Why is it different?
- Speed first: quick navigation and minimal UI friction
- Developer-first: designed around dev workflows and terminology
- Flexible by default: customizable statuses and lightweight sprints

=== What proves it?
- Organisation and project management with role-based access
- Issue creation, assignment, and status tracking
- Time tracking with start, pause, and resume timers
- Sprint planning with date ranges
- Web and desktop access via Tauri
- Self-hostable deployment for full control

=== How is it built for performance and ownership?
- React + TypeScript frontend with Tailwind and shadcn/ui
- Bun API server with Drizzle ORM and PostgreSQL
- Shared schema package for consistent types across stack
- JWT authentication with CSRF protection
