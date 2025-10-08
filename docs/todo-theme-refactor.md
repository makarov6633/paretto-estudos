Theme Refactor TODO
===================

- [ ] Update globals.css with overlay/gradient tokens derived from background/foreground
- [ ] Refactor landing (src/app/page.tsx) to use theme tokens in place of hard-coded colors
- [ ] Refactor library (src/app/library/page.tsx) to share hero visual and theme tokens
- [ ] Apply same token usage to profile, plans, chat, requests and reader pages
- [ ] Swap component-level dark colors (cards, buttons, dropdowns) for theme-aware utilities
- [ ] Fix remaining mojibake strings (footer etc.)
- [ ] After theme cleanup, audit repo for dead/duplicate code and obsolete tests
