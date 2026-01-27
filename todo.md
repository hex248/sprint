# HIGH PRIORITY

- BUGS:
- org slug and project code should only be added to url on issues/timeline pages. it happens on any page right now
- on the first attempt since page load, pressing the create issue button the default type and status are not loaded
- FEATURES:
- make login/register into a modal that appears atop the landing page
- user preferences
  - make pixel the default icon scheme

# LOW PRIORITY

- organisation
  - see members' time tracking numbers
  - export times to csv, json, etc.
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
- explore payment providers (stripe is the only one i know)
