const container = document.getElementById("contents");

// === NORMALISIERUNG (gleich mit Backend) ===
const normalizeTitle = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\b(official|video|audio|lyric|visualizer|live|remix|explicit|clean|acoustic|sped up|instrumental)\b/gi, "")
    .replace(/\b(ft\.?|feat\.?|featuring)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// === ARTIST-BILD VON WIKIPEDIA HOLEN ===
async function fetchArtistImage(artistName) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=pageimages&piprop=original&titles=${encodeURIComponent(artistName)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const pages = data?.query?.pages || {};

    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.original?.source) {
        return page.original.source; // Originalbild
      }
    }
  } catch (err) {
    console.error("Wikipedia request failed:", err);
  }

  return null;
}

// === ZEITPARSE ===
const parseDuration = (text) => {
  if (!text) return 0;
  const clean = text.replace(/[^\d:]/g, "");
  const parts = clean.split(":").map(n => parseInt(n, 10));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
};

(async function main() {

if (!container) {
  alert("Container #contents nicht gefunden!");
  return;
}

const results = [];
let artistName = null;

// === ARTIST-TEXT HOLEN (einmal global) ===
const artistElem = document.querySelector(".yt-core-attributed-string--white-space-pre-wrap");
if (artistElem) {
  artistName = artistElem.innerText.trim();
}

if (!artistName) {
  alert("Artist-Name nicht gefunden!");
  return;
}

const artistNameNorm = normalizeTitle(artistName);
const artistImageUrl = await fetchArtistImage(artistName);

// === VIDEOS SAMMELN ===
Array.from(container.children).forEach(child => {
  const link = child.querySelector("a#video-title-link");
  const durationElem = child.querySelector(".yt-badge-shape__text");

  if (link) {
    const href = link.getAttribute("href");
    const titleAttr = link.getAttribute("title");
    const durationSeconds = parseDuration(durationElem?.textContent.trim());

    if (!href || !titleAttr) return;

    let videoId = null;

    if (href.includes("v=")) {
      const params = new URLSearchParams(href.split("?")[1]);
      videoId = params.get("v");
    } else if (href.startsWith("/watch/")) {
      videoId = href.split("/").pop();
    }

    if (!videoId) return;

    results.push({
      id: videoId,
      title: titleAttr,
      title_norm: normalizeTitle(titleAttr),
      duration: durationSeconds
    });
  }
});

// === SQL ERZEUGEN ===

// 1) Artist Insert
const artistSQL = 
`INSERT INTO artists (name, name_norm, image_url)
VALUES (
  '${artistName.replace(/'/g,"''")}',
  '${artistNameNorm.replace(/'/g,"''")}',
  '${artistImageUrl ? artistImageUrl.replace(/'/g,"''") : ""}'
)
ON DUPLICATE KEY UPDATE
  image_url = VALUES(image_url),
  id = LAST_INSERT_ID(id);`;

// WICHTIG: LAST_INSERT_ID(id) sorgt dafür,
// dass du IMMER die artist_id bekommst – ob neu oder existing!
const artistIdSQL = "SELECT LAST_INSERT_ID() AS artist_id;";

// 2) Videos
const insertHeader =
"INSERT IGNORE INTO youtube_video_cache (title_norm, title, youtube_id, artist_id, duration, thumbnail)\nVALUES\n";

const insertValues = results.map(v => {
  const titleNormEsc = v.title_norm.replace(/'/g, "''");
  const titleEsc = v.title.replace(/'/g, "''");
  const thumb = `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
  const duration = Number.isFinite(v.duration) ? v.duration : 0;

  return `('${titleNormEsc}', '${titleEsc}', '${v.id}', LAST_INSERT_ID(), ${duration}, '${thumb}')`;
}).join(",\n");

const sqlFinal =
artistSQL +
"\n\n" +
artistIdSQL +
"\n\n" +
insertHeader +
insertValues +
";";

// === Download Datei ===
const blob = new Blob([sqlFinal], { type: "text/plain;charset=utf-8" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "artist_plus_videos.sql";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);

console.log("SQL generiert:", sqlFinal);

})();
