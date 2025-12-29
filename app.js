const manifestUrl = "data/manifest.json";
const state = {
  games: [],
  filtered: [],
  platforms: new Set(),
  selectedPlatforms: new Set(),
  minScore: 0,
  minPlayers: 1,
  search: "",
  sort: "score_desc",
};

const el = (id) => document.getElementById(id);

const scoreRange = el("scoreRange");
const playersRange = el("playersRange");
const searchInput = el("search");
const platformsWrap = el("platforms");
const results = el("results");
const table = el("table");
const tableBody = el("tableBody");
const viewToggle = el("viewToggle");
const scoreValue = el("scoreValue");
const playersValue = el("playersValue");
const resultCount = el("resultCount");
const totalCount = el("totalCount");
const sortSelect = el("sort");

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

function matchesPlatforms(game) {
  if (state.selectedPlatforms.size === 0) return true;
  const gamePlatforms = new Set(game.platforms || []);
  for (const platform of state.selectedPlatforms) {
    if (!gamePlatforms.has(platform)) return false;
  }
  return true;
}

function sortGames(list) {
  const sorted = [...list];
  if (state.sort === "score_desc") {
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
  state.filtered = state.games.filter((game) => {
    const titleMatch = (game.title || "").toLowerCase().includes(query);
    const scoreMatch = (game.review_score_100 ?? 0) >= state.minScore;
    const playersMatch = (game.max_players ?? 0) >= state.minPlayers;
    return titleMatch && scoreMatch && playersMatch && matchesPlatforms(game);
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
    card.innerHTML = `
      <h3>${game.title ?? "Untitled"}</h3>
      <div class="meta">
        <span class="badge">Score ${game.review_score_100 ?? "?"}</span>
        <span>Max players: ${game.max_players ?? "?"}</span>
      </div>
      <div class="meta">${(game.platforms || []).join(", ")}</div>
      <p>${game.raw_comment || ""}</p>
      <div class="links">
        ${(game.review_sources || [])
          .map((src) => `<a href="${src}" target="_blank" rel="noopener">Source</a>`)
          .join(" ")}
      </div>
    `;
    results.appendChild(card);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${game.title ?? "Untitled"}</td>
      <td>${game.review_score_100 ?? "?"}</td>
      <td>${game.max_players ?? "?"}</td>
      <td>${(game.platforms || []).join(", ")}</td>
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
  });

  renderPlatforms();
  applyFilters();
}

scoreRange.addEventListener("input", (e) => {
  state.minScore = Number(e.target.value);
  scoreValue.textContent = e.target.value;
  applyFilters();
});

playersRange.addEventListener("input", (e) => {
  state.minPlayers = Number(e.target.value);
  playersValue.textContent = e.target.value;
  applyFilters();
});

searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  applyFilters();
});

sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  applyFilters();
});

viewToggle.addEventListener("change", applyFilters);

init();
