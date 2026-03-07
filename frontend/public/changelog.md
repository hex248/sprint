# Sprint Changelog

## 2026-03-07

### Added

- New **Settings** page with dedicated **Account**, **Organisation**, and **Project** sections.
- Organisation members can now be added by **email address or username**.
- Public changelog is now available at `/changelog`.

### Improved

- Updated copy and wording across landing and legal pages for clarity.
- Added an in-app note during sign-up that Sprint is in active development.

### Fixed

- "Current sprint" now only considers open sprints.
- Sprint calendars and sprint pickers now focus on open sprints.
- New sprint date suggestions are now based on the latest sprint timeline.
- Selected day visibility in time export day picker

## 2026-03-06

### Added

- Per-project **default sprint assignment** for new issues:
  - No sprint
  - Current sprint
  - A specific open sprint
- Account settings now display your `@username`.
- CLI login approval now uses an OTP-style code input for faster entry.

### Improved

- Refined scrollbar styling across the app.

### Fixed

- Issues can no longer be assigned to closed sprints.
- Selected issues now stay selected even when table filters change.
- Fixed long description text overflowing the issue form.

## 2026-03-05

### Fixed

- Time tracking is now correctly scoped to the selected organisation (including global timers).
- Resolved cross-organisation timer visibility and state issues.

### Improved

- Behind-the-scenes delivery improvements for more reliable releases.

## 2026-03-04

### Fixed

- Resolved API consistency issues affecting settings workflows (such as issue status/type maintenance).
- Online users overlay is temporarily hidden while it is being refined.
