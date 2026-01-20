# HIGH PRIORITY

- sprints
  - timeline display
  - display sprints
- issues
  - issue type (options stored on Organisation)

# LOW PRIORITY

- setup guide
- pricing page
  - see jira and other competitors
    - explore payment providers (stripe is the only one i know)
- dedicated /register route (currently login/register are combined on /login)
- real logo
- org settings
  - disable individual features
  - manage issue types, default is [bug, feature]
    - create, edit, delete
    - assign icons to issue types (ensure each available icon is in EACH icon set)
- issues
  - assignee "note" for extra context on their role in the task
  - deadline
  - comments
    - admins are capable of deleting comments from members who are at their permission level or below (not sure if this should apply, or if ANYONE should have control over others' comments - people in an org tend to be trusted to not be trolls)
- time tracking:
  - add overlay in the bottom left for active timers if there are any. this should be minimal with the issue key (API-005), the time, and a play/pause + end button
- user preferences
  - colour scheme
  - "assign to me by default" option for new issues
- import existing jira data
- git integration
  - issue fields:
    - branch
    - commits
    - pull request (github/gitlab/bitbucket)
    - view:
      - open git diff in a new tab
- figure out if it's possible to remove the "lib/server/..." helpers altogether, and have some sort of dynamic route maker in the shared package
