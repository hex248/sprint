# HIGH PRIORITY

- projects
  - project management menu (will this be accessed from the organisations-dialog? or will it be a separate menu in the user select)
- sprints
  - timeline display
  - display sprints
- add toasts app-wide
  - for almost every network interaction that is user prompted
  - the interface feels snappy but sometimes it's hard to tell if your changes are volatile or saved
- issues
  - sprint
  - edit title & description
  - more than one assignee
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
    - Phosphor - github.com/phosphor-icons/react
  - colour scheme
- import existing jira data
