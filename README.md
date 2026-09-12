# youtube_autoscript

A small data-seeding helper that turns a YouTube artist/music page into ready-to-run **SQL**, enriched with artist images from Wikipedia.

## What it does

`main.js` is a **browser console script**: open an artist's videos page on YouTube (Music), paste the script into DevTools, and it will

- read the artist name and every video on the page (title, YouTube ID, duration),
- normalise titles (strips `official`, `feat.`, brackets, etc.) so they can be matched reliably,
- fetch the artist's original image from the Wikipedia API,
- generate `INSERT` statements for an `artists` table and a `youtube_video_cache` table, and
- download the result as `artist_plus_videos.sql`.

`wikipedia-profiler.py` is a standalone Python helper that resolves the original image URL for a given name/place via the Wikipedia API (a Python counterpart to the image-lookup logic).

## Usage

**Browser script**

1. Open an artist page on YouTube in the browser.
2. Open DevTools → Console.
3. Paste the contents of `main.js` and run it. A `.sql` file downloads automatically.

**Python helper**

```bash
pip install requests
python wikipedia-profiler.py
```

## Notes

The generated SQL targets `artists(name, name_norm, image_url)` and `youtube_video_cache(title_norm, title, youtube_id, artist_id, duration, thumbnail)`. It is meant to bootstrap a music database from public page data; selectors depend on YouTube's current DOM and may need updating over time.
