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

[**Open the Visualizer**](https://cschubiner.github.io/gamelist_manyplayers_v2/)

Once GitHub Pages is enabled for the repo, open `index.html` from the repo root in your browser to use the visualizer.

## Method

- Steam store pages are used for user review sentiment and counts.
- A second source is used when available (SteamDB, Metacritic, Steambase, etc.).
- If a game has too few reviews for a score, that is stated explicitly.

## Status

Complete — all games from `gameslist.txt` now have per‑game JSON metadata for the visualizer.

## Conventions

- File names mirror game titles (special characters preserved where possible).
- If multiple versions exist (e.g., Jackbox packs), each has its own file.
