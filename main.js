const container = document.getElementById("contents");

// === NORMALISIERUNGSFUNKTION (1:1 mit Backend) ===
const normalizeTitle = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')           // alles in runden Klammern
    .replace(/\[.*?\]/g, '')           // alles in eckigen Klammern
    .replace(/\b(official|video|audio|lyric|visualizer|live|remix|explicit|clean|acoustic|sped up|instrumental)\b/gi, '')
    .replace(/\b(ft\.?|feat\.?|featuring)\b/gi, '')
    .replace(/[^\w\s]/g, ' ')          // Sonderzeichen → Leerzeichen
    .replace(/\s+/g, ' ')              // mehrfache Leerzeichen → eins
    .trim();
};

// Sicherheits-Check
if (container) {
  const results = [];
  Array.from(container.children).forEach(child => {
    const link = child.querySelector('a#video-title-link');
    const durationElem = child.querySelector('ytd-thumbnail-overlay-time-status-renderer span, .ytd-thumbnail-overlay-time-status-renderer span');

    if (link) {
      const href = link.getAttribute('href');
      const titleAttr = link.getAttribute('title');
      const durationText = durationElem ? durationElem.textContent.trim() : null;

      // Hilfsfunktion: Zeit (z.B. "1:02:15") → Sekunden
      const parseDuration = (text) => {
        if (!text) return 0;
        const clean = text.replace(/[^\d:]/g, '');
        const parts = clean.split(':').map(p => parseInt(p.trim(), 10));
        if (parts.some(isNaN)) return 0;
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return 0;
      };

      const durationSeconds = parseDuration(durationText);

      if (href && titleAttr) {
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const videoId = urlParams.get('v');
        if (videoId) {
          results.push({
            id: videoId,
            title: titleAttr,
            title_norm: normalizeTitle(titleAttr),
            duration: durationSeconds
          });
        }
      }
    }
  });

  // === SQL-Insert Statement zusammenbauen ===
  if (results.length > 0) {
    const insertHeader = 
      "INSERT IGNORE INTO youtube_video_cache (title_norm, title, youtube_id, duration, thumbnail)\nVALUES\n";

    const insertValues = results.map(video => {
      const titleNormEsc = video.title_norm.replace(/'/g, "''");
      const titleEsc = video.title.replace(/'/g, "''");
      const thumbnail = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;

      return `('${titleNormEsc}', '${titleEsc}', '${video.id}', ${duration}, '${thumbnail}')`;
    }).join(",\n");

    // === Datei zum Download ===
    const blob = new Blob([sqlContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube_videos.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`${results.length} Videos exportiert → youtube_videos.sql`);
  } else {
    alert("Keine Videos gefunden!");
  }
}
