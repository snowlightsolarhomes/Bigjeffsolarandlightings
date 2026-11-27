# BIG JEFF SOLAR & LIGHTINGS — Shop + Admin App

Static website (no server needed). Hosted on Vercel, edited from your phone with the Admin app.

- Shop: `/`   Category pages: `/category/<name>`   Admin: `/admin`
- Data lives in `public/data/*.json`, photos/videos in `public/uploads/`.
- Admin saves to GitHub (needs a fine-grained token with Contents: Read and write). Vercel redeploys automatically.
- Run locally: `npm install` then `npm start` (port 3000).
