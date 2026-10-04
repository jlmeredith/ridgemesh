<!-- portfolio:start -->
## Portfolio standard

This project is tracked on the Portfolio board. Whoever works here, person or AI tool, keeps to it:

- **Docs, in order:** the PRD (`docs/prd/<name>-PRD.md`: what and why), the plan (`docs/plans/<name>-PLAN.md`: how; it names its `Source PRD`), the work breakdown (`docs/wbs/<name>-WBS.md`: the rows; it names its `Source Plan`), and `CHANGELOG.md` at the root (Keep a Changelog: what shipped). New documents of each kind go there.
- **The WBS is the record.** Set a row to In progress when you start it, and to Done (with evidence: a commit or PR) or Blocked (with the reason) when you stop. New work goes in as new rows, not only in chat. On a worktree branch, edit the WBS file there: `portfolio_set_status` and `portfolio_add_item` write the main checkout.
- **The changelog is the register.** When work ships, add a line under `## [Unreleased]` (Added, Changed, Fixed, Removed, Security) in the same commit.
- **Work in a git worktree on a branch**, never directly on the main branch.
- **Portfolio MCP tools:** `portfolio_project` (this project's checks and next work), `portfolio_next`, `portfolio_set_status` (update a row), `portfolio_check` (run it before you finish), `portfolio_fix` (the fix prompt for a problem the board lists), `portfolio_repair` (plans the fix for a project that fails the standard; the owner applies it on the board).

Portfolio writes this block (`portfolio repair`) and replaces it when the standard changes: edit outside the markers.
<!-- portfolio:end -->
