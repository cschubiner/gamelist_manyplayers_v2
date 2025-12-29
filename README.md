# More-Than-4 Local Multiplayer Review Notes

This repo contains per‑game review summaries for local multiplayer titles listed in `gameslist.txt`. Each game has its own markdown file under `reviews/` with:

- A short summary
- Review signals (Steam user reviews + at least one other source like SteamDB, Metacritic, Steambase, or console storefronts)
- Brief notes
- Source links

## Structure

- `gameslist.txt` — source list of games
- `index.html` — GitHub Pages visualizer
- `reviews/` — one markdown file per game
- `data/` — per‑game JSON data + manifest used by the visualizer

## Visualizer

Once GitHub Pages is enabled for the repo, open `index.html` from the repo root in your browser to use the visualizer. On GitHub Pages, it will be available at the repository Pages URL.

## Method

- Steam store pages are used for user review sentiment and counts.
- A second source is used when available (SteamDB, Metacritic, Steambase, etc.).
- If a game has too few reviews for a score, that is stated explicitly.

## Status

Work in progress — not all games from `gameslist.txt` have review files yet.

## Conventions

- File names mirror game titles (special characters preserved where possible).
- If multiple versions exist (e.g., Jackbox packs), each has its own file.
