<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All app data persists locally in IndexedDB via `src/lib/db.ts` + `DataProvider` (`src/lib/store.tsx`); no backend — the app must work offline and cost-free.
- Colour science (126 reference tones, Lab, CIEDE2000) lives in `src/lib/colors.ts`; scan sampling/homography in `src/lib/scan.ts`; covered by `src/test/rules.test.ts`.
- Reference tone codes must stay stable — saved beads and backups reference them.
