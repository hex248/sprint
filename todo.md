# HIGH PRIORITY

- FEATURES:
- org settings:
  - manage issue types
    - create, edit, delete
    - assign icons to issue types (ensure each available icon is in EACH icon set)
- filters
- time tracking:
  - add overlay in the bottom left for active timers if there are any. this should be minimal with the issue key (API-005), the time, and a play/pause + end button
- pricing page
  - see jira and other competitors
    - explore payment providers (stripe is the only one i know)
- add "modal=true" in issue urls that are copied, and open issue-modal.tsx instead of the issue-detail-pane.tsx

# LOW PRIORITY

- dedicated /register route (currently login/register are combined on /login)
- real logo
- issues
  - assignee "note" for extra context on their role in the task
  - deadline
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
- request logging
