# HIGH PRIORITY

- FIX: server configuration dialog is screen width
- projects menu
  - delete project
- sprints
  - prevent overlapping sprints in the same project
  - timeline display
  - display sprints
  - edit sprint
  - delete sprint
- issues
  - edit title & description
  - assignee "note" for extra context on their role in the task
  - issue type (options stored on Organisation)
  - issue type icons
- org settings
  - manage issue types, default is [bug, feature]
    - create, edit, delete
    - assign icons to issue types
- user preferences
  - "assign to me by default" option for new issues

# LOW PRIORITY

- setup guide
- pricing page
  - see jira and other competitors
    - explore payment providers (stripe is the only one i know)
- dedicated /register route (currently login/register are combined on /login)
- real logo
- org settings
  - disable individual features
- issues
  - deadline
  - comments
    - admins are capable of deleting comments from members who are at their permission level or below (not sure if this should apply, or if ANYONE should have control over others' comments - people in an org tend to be trusted to not be trolls)
- time tracking:
  - add overlay in the bottom left for active timers if there are any. this should be minimal with the issue key (API-005), the time, and a play/pause + end button
- user preferences
  - icon style:
    i think the best way to this is have an "Icon" component with "icon" param, and "type" param. for example: "trash", "pixel" will use the pixelarticons "Trash" icon.
    types:
    - Lucide
    - Pixel - npm: @nsmr/pixelart-react & pixelarticons.com
    - Phosphor - https://github.com/phosphor-icons/react
    - HugeIcons - https://hugeicons.com/icons?style=Stroke&type=Rounded
  - colour scheme
- import existing jira data
