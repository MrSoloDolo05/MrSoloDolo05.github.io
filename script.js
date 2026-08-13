// ==========================
// STATE (global app data)
// ==========================
let songs = [];            // full dataset from JSON
let filteredSongs = [];   // songs after filtering
let currentIndex = 0;     // selected song index
let isPlaying = false;    // play/pause toggle

// fixed colors per genre (for chart)
const genreColors = {
  "post-hardcore": "#ff6b6b",
  "indie rock": "#5f27cd",
  "electronic": "#1dd1a1",
  "hardcore punk": "#ee5253",
  "indie folk": "#feca57",
  "grunge": "#576574",
  "alternative rock": "#54a0ff",
  "uk garage": "#00d2d3",
  "hip hop": "#222f3e",
  "alternative hip hop": "#10ac84",
  "instrumental hip hop": "#341f97",
  "indie rap": "#ff9ff3"
};

// ==========================
// LOAD DATA (FLOOR - API)
// ==========================
async function fetchData() {
  try {
    const res = await fetch("./data.json"); // load local JSON file
    songs = await res.json();

    filteredSongs = songs; // start with full list

    renderPlaylist(filteredSongs); // show songs in DOM
    drawGenreChart(filteredSongs); // draw canvas chart

    // restore last selected song
    const lastSong = loadFromLocalStorage("lastSong");
    if (lastSong) {
      renderSong(lastSong);
    }

  } catch (err) {
    showError("Failed to load songs");
  }
}

// ==========================
// RENDER PLAYLIST (DOM)
// ==========================
// Creates clickable list of songs
function renderPlaylist(list) {
  const container = document.getElementById("playlistContainer");
  container.innerHTML = "";

  for (let i = 0; i < list.length; i++) {
    let song = list[i];

    let item = document.createElement("div");
    item.className = "playlist-item";

    item.textContent = song.title + " - " + song.artist;

    // click = show song details
    item.onclick = function () {
      currentIndex = i;
      renderSong(song);
      saveToLocalStorage("lastSong", song);
    };

    container.appendChild(item);
  }
}

// ==========================
// RENDER SONG CARD (CENTER UI)
// ==========================
function renderSong(song) {
  const card = document.getElementById("songCard");

  // SONG INFO CARD - with image error handling
  card.innerHTML = `
    <img src="./${song.cover}" class="cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
    <div class="cover-placeholder" style="display: none;">${song.album || song.title}<br>Album Cover</div>
    <h2>${song.title}</h2>
    <p><b>Artist:</b> ${song.artist}</p>
    <p><b>Album:</b> ${song.album || 'Unknown'}</p>
    <p><b>Genre:</b> ${song.genre}</p>
    <p><b>Year:</b> ${song.year}</p>
  `;

  // separate lyrics card
  renderLyrics(song);
}

// ==========================
// LYRICS CARD (extra feature)
// ==========================
function renderLyrics(song) {
  const box = document.getElementById("lyricsCard");

  if (song.lyrics) {
    box.innerHTML = `
      <h3>Lyrics</h3>
      <p>${song.lyrics}</p>
    `;
  } else {
    box.innerHTML = `
      <h3>Lyrics</h3>
      <p>No lyrics available</p>
    `;
  }
}

// ==========================
// FILTER SYSTEM (TIER 1)
// ==========================
function handleFilter() {
  let year = document.getElementById("filterYear").value;
  let genre = document.getElementById("filterGenre").value;
  let artist = document.getElementById("filterArtist").value;

  filteredSongs = [];

  // simple loop filter (beginner-friendly)
  for (let i = 0; i < songs.length; i++) {
    let song = songs[i];

    let match =
      (!year || song.year == year) &&
      (!genre || song.genre.toLowerCase().includes(genre.toLowerCase())) &&
      (!artist || song.artist.toLowerCase().includes(artist.toLowerCase()));

    if (match) {
      filteredSongs.push(song);
    }
  }

  renderPlaylist(filteredSongs);
  drawGenreChart(filteredSongs);

  // auto-select first result
  if (filteredSongs.length > 0) {
    renderSong(filteredSongs[0]);
    currentIndex = 0;
  } else {
    document.getElementById("songCard").innerHTML =
      "<p>No songs match filters</p>";
  }
}

// ==========================
// CANVAS CHART (TIER 2)
// ==========================
function drawGenreChart(list) {
  const canvas = document.getElementById("genreChart");
  const ctx = canvas.getContext("2d");

  // resize canvas properly
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;

  let width = canvas.width;
  let height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // count genres
  let genreCounts = {};

  for (let i = 0; i < list.length; i++) {
    let genre = list[i].genre || "Unknown";

    if (genreCounts[genre]) {
      genreCounts[genre]++;
    } else {
      genreCounts[genre] = 1;
    }
  }

  // convert to array (simple structure)
  let sorted = [];

  for (let g in genreCounts) {
    sorted.push({ genre: g, count: genreCounts[g] });
  }

  // sort biggest first
  sorted.sort((a, b) => b.count - a.count);

  // show only top 6
  sorted = sorted.slice(0, 6);

  let barWidth = width / sorted.length;

  ctx.textAlign = "center";
  ctx.font = "12px Arial";

  // draw bars
  for (let i = 0; i < sorted.length; i++) {
    let item = sorted[i];

    let barHeight = (item.count / sorted[0].count) * (height - 50);

    let x = i * barWidth + barWidth / 2;
    let y = height - barHeight - 20;

    // color per genre
    ctx.fillStyle = genreColors[item.genre] || "#999";

    ctx.fillRect(x - 20, y, 40, barHeight);

    // labels
    ctx.fillStyle = "#000";
    ctx.fillText(item.genre, x, height - 5);
    ctx.fillText(item.count, x, y - 5);
  }
}

// ==========================
// LOCAL STORAGE (TIER 3)
// ==========================
function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
  let data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// ==========================
// ERROR DISPLAY
// ==========================
function showError(msg) {
  document.getElementById("statusMessage").textContent = msg;
}

// ==========================
// CONTROLS (UI EVENTS)
// ==========================

// filters
document.getElementById("filterYear").oninput = handleFilter;
document.getElementById("filterGenre").oninput = handleFilter;
document.getElementById("filterArtist").oninput = handleFilter;

// navigation
document.getElementById("prevBtn").onclick = function () {
  if (filteredSongs.length === 0) return;
  currentIndex--;
  if (currentIndex < 0) currentIndex = filteredSongs.length - 1;
  renderSong(filteredSongs[currentIndex]);
};

document.getElementById("nextBtn").onclick = function () {
  if (filteredSongs.length === 0) return;
  currentIndex++;
  if (currentIndex >= filteredSongs.length) currentIndex = 0;
  renderSong(filteredSongs[currentIndex]);
};

// play button (UI only)
document.getElementById("playBtn").onclick = function () {
  isPlaying = !isPlaying;
  this.textContent = isPlaying ? "Pause" : "Play";
  showError(isPlaying ? "Playing..." : "Paused");
};

// ==========================
// INIT APP
// ==========================
fetchData();
