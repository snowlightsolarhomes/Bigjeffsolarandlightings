# Deploy BIG JEFF SOLAR: GitHub Codespaces + Vercel

## One-time setup
1. github.com -> New repository -> name `bigjeff-solar` -> **Private** -> tick "Add a README" -> Create.
2. On the repo: Code -> Codespaces -> **Create codespace on main**.
3. In the Codespace Explorer, upload `bigjeff-solar-website-updated.zip` (drag in, or right-click -> Upload).
4. In the terminal:
   ```bash
   unzip bigjeff-solar-website-updated.zip
   shopt -s dotglob && mv bigjeff/* . && rmdir bigjeff && rm *.zip
   npm install
   npm start
   ```
5. Click "Open in Browser" on the port 3000 pop-up. Check the shop and `/admin` (password `bigjeff2026`).
6. Stop the server (Ctrl+C), then save to GitHub:
   ```bash
   git add -A && git commit -m "BIG JEFF SOLAR site" && git push
   ```
7. vercel.com -> sign in with GitHub -> Add New -> Project -> Import `bigjeff-solar` -> Framework **Other** -> Deploy.
8. Open the `.vercel.app` link. Add your domain in Project -> Settings -> Domains.

## Adding products later
1. Open the Codespace -> `ADMIN_PASSWORD='newpass' npm start` -> open port 3000 -> `/admin`.
2. Add/edit products, photos, videos. Stop the server.
3. `git add -A && git commit -m "new products" && git push` -> Vercel redeploys in about a minute.

Notes: `/admin` only works inside Codespaces/local (Vercel is read-only). Keep each file under 100MB (GitHub limit). New products show "Call for price" until you set a price in admin.
