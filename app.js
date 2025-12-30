const manifestUrl = "data/manifest.json";
const state = {
  games: [],
  filtered: [],
  platforms: new Set(),
  screenModes: new Set(),
  playModes: new Set(),
  inputMethods: new Set(),
  selectedPlatforms: new Set(),
  selectedScreenModes: new Set(),
  selectedPlayModes: new Set(),
  selectedInputMethods: new Set(),
  minScore: 0,
  minPopularity: 0,
  minPlayers: 1,
  minReviewCount: 0,
  search: "",
  notesSearch: "",
  updatedAfter: "",
  sort: "score_desc",
  requiresVrOnly: false,
};

const el = (id) => document.getElementById(id);

const scoreRange = el("scoreRange");
const playersRange = el("playersRange");
const reviewCountRange = el("reviewCountRange");
const searchInput = el("search");
const notesSearchInput = el("notesSearch");
const updatedAfterInput = el("updatedAfter");
const platformsWrap = el("platforms");
const screenModesWrap = el("screenModes");
const playModesWrap = el("playModes");
const inputMethodsWrap = el("inputMethods");
const results = el("results");
const table = el("table");
const tableBody = el("tableBody");
const viewToggle = el("viewToggle");
const vrToggle = el("vrToggle");
const scoreValue = el("scoreValue");
const popularityValue = el("popularityValue");
const playersValue = el("playersValue");
const reviewCountValue = el("reviewCountValue");
const resultCount = el("resultCount");
const totalCount = el("totalCount");
const sortSelect = el("sort");
const popularityRange = el("popularityRange");

const fetchJson = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) {
      throw new Error(`Failed to load ${url}: ${r.status}`);
    }
    return r.json();
  });

const encodePath = (path) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

function normalizePlatforms(list = []) {
  return list.map((p) => p.trim()).filter(Boolean);
}

function renderPlatforms() {
  platformsWrap.innerHTML = "";
  [...state.platforms].sort().forEach((platform) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.selectedPlatforms.has(platform) ? " active" : "");
    chip.type = "button";
    chip.textContent = platform;
    chip.addEventListener("click", () => {
      if (state.selectedPlatforms.has(platform)) {
        state.selectedPlatforms.delete(platform);
      } else {
        state.selectedPlatforms.add(platform);
      }
      renderPlatforms();
      applyFilters();
    });
    platformsWrap.appendChild(chip);
  });
}

function renderChipGroup(container, values, selectedSet) {
  container.innerHTML = "";
  [...values].sort().forEach((value) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (selectedSet.has(value) ? " active" : "");
    chip.type = "button";
    chip.textContent = value;
    chip.addEventListener("click", () => {
      if (selectedSet.has(value)) {
        selectedSet.delete(value);
      } else {
        selectedSet.add(value);
      }
      renderChipGroup(container, values, selectedSet);
      applyFilters();
    });
    container.appendChild(chip);
  });
}

function matchesPlatforms(game) {
  if (state.selectedPlatforms.size === 0) return true;
  const gamePlatforms = new Set(game.platforms || []);
  for (const platform of state.selectedPlatforms) {
    if (!gamePlatforms.has(platform)) return false;
  }
  return true;
}

function matchesScreenModes(game) {
  if (state.selectedScreenModes.size === 0) return true;
  return state.selectedScreenModes.has(game.screen_mode);
}

function matchesPlayModes(game) {
  if (state.selectedPlayModes.size === 0) return true;
  return state.selectedPlayModes.has(game.play_mode);
}

function matchesInputMethods(game) {
  if (state.selectedInputMethods.size === 0) return true;
  const gameInputs = new Set(game.input_methods || []);
  for (const input of state.selectedInputMethods) {
    if (!gameInputs.has(input)) return false;
  }
  return true;
}

function sortGames(list) {
  const sorted = [...list];
  if (state.sort === "popularity_desc") {
    sorted.sort((a, b) => (b.popularity_score_100 ?? 0) - (a.popularity_score_100 ?? 0));
  } else if (state.sort === "score_desc") {
    sorted.sort((a, b) => (b.review_score_100 ?? 0) - (a.review_score_100 ?? 0));
  } else if (state.sort === "players_desc") {
    sorted.sort((a, b) => (b.max_players ?? 0) - (a.max_players ?? 0));
  } else {
    sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }
  return sorted;
}

function applyFilters() {
  const query = state.search.toLowerCase();
  const notesQuery = state.notesSearch.toLowerCase();
  state.filtered = state.games.filter((game) => {
    const titleMatch = (game.title || "").toLowerCase().includes(query);
    const notesMatch = notesQuery === "" ||
      (game.notes || "").toLowerCase().includes(notesQuery) ||
      (game.raw_comment || "").toLowerCase().includes(notesQuery);
    const scoreMatch = (game.review_score_100 ?? 0) >= state.minScore;
    const popularityMatch = (game.popularity_score_100 ?? 0) >= state.minPopularity;
    const playersMatch = (game.max_players ?? 0) >= state.minPlayers;
    const reviewCountMatch = (game.review_count ?? 0) >= state.minReviewCount;
    const vrMatch = !state.requiresVrOnly || game.requires_vr === true;
    const updatedMatch = state.updatedAfter === "" ||
      (game.last_updated && game.last_updated >= state.updatedAfter);
    return (
      titleMatch &&
      notesMatch &&
      scoreMatch &&
      popularityMatch &&
      playersMatch &&
      reviewCountMatch &&
      matchesPlatforms(game) &&
      matchesScreenModes(game) &&
      matchesPlayModes(game) &&
      matchesInputMethods(game) &&
      vrMatch &&
      updatedMatch
    );
  });
  state.filtered = sortGames(state.filtered);
  render();
}

function render() {
  resultCount.textContent = state.filtered.length.toString();
  totalCount.textContent = state.games.length.toString();

  results.innerHTML = "";
  tableBody.innerHTML = "";

  state.filtered.forEach((game) => {
    const card = document.createElement("article");
    card.className = "card";
    const steamUrl = (game.review_sources || []).find(src => src.includes("store.steampowered.com"));
    const titleHtml = steamUrl
      ? `<a href="${steamUrl}" target="_blank" rel="noopener">${game.title ?? "Untitled"}</a>`
      : (game.title ?? "Untitled");
    card.innerHTML = `
      <h3>${titleHtml}</h3>
      <div class="meta">
        <span class="badge players-badge">${game.max_players ?? "?"} players</span>
        <span class="badge">Score ${game.review_score_100 ?? "?"}</span>
        <span class="badge">Popularity ${game.popularity_score_100 ?? "?"}</span>
        <span>Reviews: ${game.review_count ?? "?"}</span>
      </div>
      <div class="meta">${(game.platforms || []).join(", ")}</div>
      <div class="meta secondary">
        <span>Screen: ${game.screen_mode || "?"}</span>
        <span>Play: ${game.play_mode || "?"}</span>
        <span>Input: ${(game.input_methods || []).join(", ") || "?"}</span>
        ${game.requires_vr ? '<span class="vr-tag">VR</span>' : ""}
      </div>
      <p>${game.raw_comment || ""}</p>
      ${game.notes ? `<p class="notes">${game.notes}</p>` : ""}
      <div class="links">
        ${(game.review_sources || [])
          .filter(src => !src.includes("store.steampowered.com"))
          .map((src) => `<a href="${src}" target="_blank" rel="noopener">Source</a>`)
          .join(" ")}
      </div>
      ${game.last_updated ? `<div class="updated">Updated: ${game.last_updated}</div>` : ""}
    `;
    results.appendChild(card);

    const row = document.createElement("tr");
    const tableTitleHtml = steamUrl
      ? `<a href="${steamUrl}" target="_blank" rel="noopener">${game.title ?? "Untitled"}</a>`
      : (game.title ?? "Untitled");
    row.innerHTML = `
      <td>${tableTitleHtml}</td>
      <td>${game.review_score_100 ?? "?"}</td>
      <td>${game.popularity_score_100 ?? "?"}</td>
      <td>${game.max_players ?? "?"}</td>
      <td>${game.review_count ?? "?"}</td>
      <td>${(game.platforms || []).join(", ")}</td>
      <td>${game.last_updated ?? "?"}</td>
    `;
    tableBody.appendChild(row);
  });

  results.classList.toggle("hidden", viewToggle.checked);
  table.classList.toggle("hidden", !viewToggle.checked);
}

async function init() {
  const manifest = await fetchJson(manifestUrl);
  const files = manifest.files || [];
  const data = await Promise.all(files.map((file) => fetchJson(encodePath(file))));

  data.forEach((game) => {
    game.platforms = normalizePlatforms(game.platforms);
    game.review_sources = (game.review_sources || []).filter(Boolean);
    state.games.push(game);
    game.platforms.forEach((p) => state.platforms.add(p));
    if (game.screen_mode) state.screenModes.add(game.screen_mode);
    if (game.play_mode) state.playModes.add(game.play_mode);
    (game.input_methods || []).forEach((i) => state.inputMethods.add(i));
  });

  renderPlatforms();
  renderChipGroup(screenModesWrap, state.screenModes, state.selectedScreenModes);
  renderChipGroup(playModesWrap, state.playModes, state.selectedPlayModes);
  renderChipGroup(inputMethodsWrap, state.inputMethods, state.selectedInputMethods);
  applyFilters();
}

scoreRange.addEventListener("input", (e) => {
  state.minScore = Number(e.target.value);
  scoreValue.textContent = e.target.value;
  applyFilters();
});

popularityRange.addEventListener("input", (e) => {
  state.minPopularity = Number(e.target.value);
  popularityValue.textContent = e.target.value;
  applyFilters();
});

playersRange.addEventListener("input", (e) => {
  state.minPlayers = Number(e.target.value);
  playersValue.textContent = e.target.value;
  applyFilters();
});

reviewCountRange.addEventListener("input", (e) => {
  state.minReviewCount = Number(e.target.value);
  reviewCountValue.textContent = e.target.value;
  applyFilters();
});

searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  applyFilters();
});

notesSearchInput.addEventListener("input", (e) => {
  state.notesSearch = e.target.value;
  applyFilters();
});

updatedAfterInput.addEventListener("input", (e) => {
  state.updatedAfter = e.target.value;
  applyFilters();
});

sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  applyFilters();
});

viewToggle.addEventListener("change", applyFilters);
vrToggle.addEventListener("change", (e) => {
  state.requiresVrOnly = e.target.checked;
  applyFilters();
});

init();
