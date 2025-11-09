(() => {
  const videos = [];

  // Alle Videolinks auf der Seite holen, die wie /watch?v=... aussehen
  document.querySelectorAll('a[href^="/watch?v="]').forEach(link => {
    const url = new URL(link.href, location.origin);
    const videoId = url.searchParams.get('v');
    if (!videoId) return;

    // Titel finden (meist im #video-title)
    const titleEl = link.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer')
      ?.querySelector('#video-title');
    const title = titleEl ? titleEl.textContent.trim() : '(kein Titel gefunden)';

    // Duplikate vermeiden
    if (!videos.some(v => v.videoId === videoId)) {
      videos.push({ title, videoId });
    }
  });

  console.clear();
  console.log(`📺 Gefundene YouTube-Videos: ${videos.length}`);
  console.table(videos);

  // Optional: alle IDs als einfache Liste ausgeben
  console.log("Video IDs:", videos.map(v => v.videoId));
})();
