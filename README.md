# BIG JEFF SOLAR & LIGHTINGS — Website / Shop

**Powering a Brighter Tomorrow** ☀ · RC: 6953954

A complete shop website for BIG JEFF SOLAR & LIGHTINGS with product categories,
product videos, WhatsApp ordering, and an admin panel for uploading photos & videos.

## Pages

| Page | URL | What it does |
|------|-----|--------------|
| **Shop (customers)** | `/` | Hero, categories, product grid, video gallery, contact, WhatsApp ordering |
| **Admin (you)** | `/admin` | Login → add/edit/delete products, upload photos & videos, manage categories |

## Admin login

- **Password:** `bigjeff2026`
- To change it, start the server with: `ADMIN_PASSWORD=yourpassword node server.js`
- (Session lasts 24 hours, then you log in again.)

## How to add a product (with photos & videos)

1. Open `/admin` and sign in.
2. Fill in the name, category (pick existing or type a new one), price, description.
3. **📸 Photos** — tap the photo box and select one or more images (JPG/PNG/WEBP).
4. **🎬 Videos** — tap the video box and select one or more videos (MP4/WEBM/MOV, up to 300MB each),
   **or** paste a YouTube link.
5. Press **🚀 Publish Product**. It appears instantly on the shop with a "Watch Video" button.

On each product you can also ✏️ edit or 🗑 delete, and remove individual photos/videos with the **×** button.

## Run locally

```bash
cd bigjeff
npm install
node seed.js     # optional: loads the 8 demo products (already done)
node server.js   # opens on port 3000
```

- Shop: http://localhost:3000/
- Admin: http://localhost:3000/admin

## Deploying on a VPS / host

```bash
npm install --production
ADMIN_PASSWORD='your-strong-password' PORT=80 node server.js
```

Put it behind a domain with HTTPS (e.g. nginx + certbot). Product files are saved in
`uploads/`, product data in `data/products.json` — **back up both folders** regularly.

## Contact details baked into the site

- Phone: 08149439431 · WhatsApp: 09025511941
- Shop F140, Alaba's International Market, Alaba Arago Junction, Ojo, Lagos 102110
- Facebook / Instagram / Google Business / Google Maps links included in header, contact & footer
