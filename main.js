const container = document.getElementById("contents");

// Sicherheits‑Check
if (container) {
  const results = [];
  
  Array.from(container.children).forEach(child => {
    const link = child.querySelector('a#video-title-link');
    if (link) {
      const href = link.getAttribute('href'); 
      const titleAttr = link.getAttribute('title'); // <--- hier title statt aria-label
      
      if (href) {
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const videoId = urlParams.get('v');
        if (videoId && titleAttr) {
          results.push({ id: videoId, title: titleAttr });
        }
      }
    }
  });

  // SQL-Insert Statement zusammenbauen
  if (results.length > 0) {
    const insertHeader = "INSERT INTO youtube_video_cache (title_norm, title, youtube_id, thumbnail)\nVALUES\n";
    const insertValues = results.map(video => {
      const titleNorm = video.title.toLowerCase().replace(/'/g, "''"); // einfache Normalisierung
      const title = video.title.replace(/'/g, "''"); // Escape für SQL
      const thumbnail = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
      return `('${titleNorm}', '${title}', '${video.id}', '${thumbnail}')`;
    }).join(",\n");

    const insertFooter = `\nON DUPLICATE KEY UPDATE\n  title = VALUES(title),\n  youtube_id = VALUES(youtube_id),\n  thumbnail = VALUES(thumbnail);`;

    const sqlContent = insertHeader + insertValues + insertFooter;

    // Datei zum Download bereitstellen
    const blob = new Blob([sqlContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube_videos.sql";
    a.click();
    URL.revokeObjectURL(url);
  }
}
