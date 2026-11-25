# RC Center Website: Complete Guide

This guide takes you from the files you received to a live website, and shows you how to add photos, videos and memories yourself through the admin panel.

---

## Part 1: What you received

```
rc-center/
├── index.html            ← Public website (all sections)
├── GUIDE.md              ← This guide
├── css/
│   └── style.css         ← Red / gold / white theme, animations, mobile layout
├── js/
│   └── app.js            ← Loads content, gallery, lightbox, videos, quotes
├── data/
│   └── site-data.json    ← ALL website text, photo list, videos, memories
├── images/
│   ├── hero/             ← Hero banner image goes here
│   └── gallery/          ← Photos go here, in one folder per year
└── admin/
    ├── index.html        ← Admin panel page
    ├── admin.css
    └── admin.js          ← Admin logic (contains the password)
```

**Important:** The text and photos you see on the sample site are placeholders. Replace them using the admin panel.

---

## Part 2: Preview on your own computer

1. Install **Python** (free, from python.org) if you don't have it.
2. Open a terminal or Command Prompt in the `rc-center` folder.
3. Run:
   ```
   python -m http.server 8000
   ```
4. Open your browser and go to:
   - Website: `http://localhost:8000`
   - Admin panel: `http://localhost:8000/admin/`

> Do not double-click `index.html` directly. The browser blocks the content file in that mode, so the page will show a loading message. Always use a server, either the one above or the online hosting in Part 5.

---

## Part 3: Change the admin password (do this first)

1. Open `admin/admin.js` in any text editor (Notepad, VS Code).
2. On line 10, change:
   ```js
   const ADMIN_PASSWORD = 'change-this-password';
   ```
   to something only your team knows, for example:
   ```js
   const ADMIN_PASSWORD = 'RcCenter@Ganesha2026';
   ```
3. Save the file.

**Security note:** This password protects the admin panel from casual visitors. Because the website is static (it has no login server), anyone who reads the source code could find the password. Keep the admin link private, and do not use an important password you use elsewhere. For stronger protection, see Part 7.

---

## Part 4: Using the admin panel

Open `/admin/`, enter your password, and you will see the content management tabs.

### 4.1 Photos (most used)

1. Go to the **Photos** tab.
2. Choose the **Festival year** (for example 2025).
3. Choose the **Event** (Ganesh Pooja, Maha Annadanam, Evening Bhajans, Utti Mahotsavam, Cultural Programs, Ganapati Nimajjanam).
4. Type a **Caption** (for example "Morning Ganesh Pooja, Day 3").
5. Click **Photo file** and pick the photo from your computer. A preview appears. The panel automatically resizes and compresses it, so the website loads quickly.
6. Click **Add Photo & Download Optimized File**. Your browser downloads a small `.jpg` file.
7. Repeat for more photos. Each download is named automatically.

**Upload the downloaded photos to the project:**
- Put each file in `images/gallery/YEAR/`, using the year it belongs to. For example, a 2025 photo goes in `images/gallery/2025/`.
- Create the year folder if it does not exist yet.

**Tips for good photos**
- Landscape or square photos look best. Portrait photos are cropped nicely.
- Use bright, sharp photos. The panel handles file size for you.
- Keep captions short, so they fit neatly on the photo card.

### 4.2 Videos

1. Go to the **Videos** tab.
2. Choose the **Festival year** and **Event**, add a caption, and select the video.
3. Click **Add Video & Download File**. The browser adds the video entry and downloads the video file; the admin cannot upload files directly to your web host.
4. Save the downloaded file inside `videos/gallery/YEAR/` in your project (for example `videos/gallery/2026/`).
5. Publish the updated `site-data.json` as described in Step 4.7, along with the video file.

Use a video format supported by visitors' browsers, such as MP4 (H.264). Large videos can take time to download and may exceed hosting limits.

### 4.3 Instagram Reels

Reels replace the YouTube video section. The website shows them using Instagram's official embed, so they play right on the page.

1. Open the reel on Instagram (it must be a **public** account post).
2. Tap the **•••** menu, then **Copy link**. It looks like `https://www.instagram.com/reel/XXXXXXXXXXX/`.
3. In the admin, go to the **Instagram Reels** tab, enter a title, choose the year, paste the link and click **Add Reel**.
4. Publish as in Step 4.7. The new reel appears in the "Instagram Reels" section.

Until you add reels, the section shows "Our celebration reels are coming soon" with a link to @rc_center_official.

### 4.4 Memories (previous years)

1. Go to **Memories**.
2. Choose the year, write a title (for example "Ganesh Utsav 2024") and a short description.
3. Choose a cover photo and click **Add Memory & Download Optimized Cover**.
4. Upload the downloaded cover to `images/gallery/YEAR/`.

### 4.5 Years & Events

- **Add Festival Year** when a new year begins (for example 2026). Add the year before adding its photos.
- **Festival Events**: you can edit the icon, name and description of each event. Changes save automatically.

### 4.6 Hero & Quotes

- **Hero banner**: upload your main Ganesha festival image. Use a wide image (1600 × 900 or similar). The panel downloads an optimised copy. Upload it to `images/hero/`.
- **Quotes & slokas**: add devotional quotes. They rotate automatically on the website. Delete any you don't want.

### 4.7 Save & Publish (the final step)

Every change is saved in the browser automatically, but **the public website only updates after you publish.** Follow these three steps:

1. Click **Download site-data.json**.
2. Upload the downloaded photos to `images/gallery/YEAR/` and the downloaded videos to `videos/gallery/YEAR/` in your project.
3. Replace the file `data/site-data.json` in your project with the downloaded file. Then publish (Part 5).

The admin panel prepares the video entry and downloads the selected video; it does not transfer files directly to your web host. Both the video file and updated `site-data.json` must be included when you publish.

**Working from another computer or browser?** Go to Save & Publish and click **Import Existing site-data.json**, selecting the live file from `data/`, before making changes. Otherwise you could start from old content.

**Need to undo your changes?** Click **Discard Unsaved Changes**. This reloads the live content.

---

### 4.8 Text, notes, colours and music (new)

**Text & Notes tab:** change any wording on the homepage: the hero title an6+
d quote, the Festival Highlights intro, the community note, the About section and the Celebrations text. For paragraphs and lists, write **one item per line**. Each line becomes its own paragraph.

**Colours & Music tab:**
- Pick colours with the colour boxes. The whole website updates. Click **Reset to devotional default** to go back.
- **Background music:** upload your MP3 to the `audio/` folder with the exact file name shown in the admin (default `audio/om-ganeshaya-namah.mp3`). Only use music you have the rights to use. Until the file is uploaded, the music player stays hidden.
- Visitors press **Play Music** to start it (browsers do not allow music to start on its own). They can press the speaker button to **mute** or **unmute**. Their choice is remembered on that device.

**Highlights:** the homepage shows the **3 latest memories**, the **6 latest photos** and the **2 latest reels** automatically. Add memories, photos and reels in the admin, and the highlights update by themselves.

## Part 5: Publish the website online (free)

### Option A: GitHub Pages (recommended, free)

**Step 1: Create a GitHub account**
- Go to github.com and sign up with an email address the committee can access.

**Step 2: Create a repository**
1. Click the **+** at the top right, then **New repository**.
2. Name it `rc-center`.
3. Choose **Public**, then click **Create repository**.

**Step 3: Upload your files**
1. On the new repository page, click **Add file → Upload files**.
2. Drag in **everything inside** the `rc-center` folder (the `index.html`, `css`, `js`, `data`, `images` and `admin` items), not the folder itself.
3. Click **Commit changes**.

**Step 4: Turn on the website**
1. Go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Choose **main** and **/ (root)**, then click **Save**.
4. After 1–2 minutes your website is live at:
   `https://YOUR-USERNAME.github.io/rc-center/`
5. The admin panel is at:
   `https://YOUR-USERNAME.github.io/rc-center/admin/`

**Step 5: Updating the website later**
- Use the admin panel and the steps in Part 4.7.
- To upload files on GitHub: open the folder (for example `images/gallery/2025`), click **Add file → Upload files**, and drop the photos in.
- To update the content file: open `data/site-data.json`, click the pencil icon, or use **Add file → Upload files** with the same file name to replace it. Then click **Commit changes**.
- Changes appear within a few minutes.

### Option B: Netlify Drop (even simpler)

1. Go to app.netlify.com/drop.
2. Drag the entire `rc-center` folder onto the page.
3. You get an instant web address. To update, drag the folder again.
   - Note: this gives a new address each time unless you create a free account and set a custom name.

### Option C: Your own domain (optional)

If you buy a domain such as `rccenter.org`, both GitHub Pages and Netlify can connect it. Their help pages walk you through the DNS settings.

---

## Part 6: Image tips for the best result

| Purpose | Recommended size | Notes |
|---|---|---|
| Hero banner | 1600 × 900 px | Use a bright, sharp Ganesha festival photo |
| Gallery photos | Any; the panel resizes to 1600 px wide | Landscape works best |
| Memory covers | Any; resized to 1200 px wide | Good group photos |

- Only use photos you have permission to publish, especially photos showing people. Obtain consent from families where needed.
- Use your own photos and artwork. Commercial Ganesha artwork may have licence restrictions.

---

## Part 7: Securing the admin panel (optional, recommended for larger teams)

The built-in password is a simple lock. For stronger protection:
- **Host the admin folder privately**: keep the GitHub repository private (GitHub Pages then needs a paid plan), or ask a web developer to put the `/admin` page behind a login service such as Netlify's password protection on paid plans or Cloudflare Access (free for small teams).
- **Share the password only with trusted committee members**, and change it when someone leaves the team.

---

## Part 8: Merging with your existing project

You mentioned you already have a website. The new site is a complete replacement for the look and structure, but you can keep your existing project and move content across:

1. **Keep your existing files** in a separate folder as a backup.
2. **Copy** the `css`, `js`, `data`, `images` and `admin` folders into your project.
3. **Replace** your homepage with the new `index.html`, or copy its sections into your existing page.
4. **Move your old content** (photos, text, dates) into the admin panel, or into `data/site-data.json`.

If you'd like me to merge the new design directly into your existing files, please upload your current project (or its `index.html`, CSS and image folder) and I will adapt it while keeping your existing features working.

---

## Part 9: Troubleshooting

| Problem | Fix |
|---|---|
| Page shows "Content could not be loaded" | Open the site through a server (Part 2 or Part 5). Do not double-click `index.html`. |
| Photo doesn't appear on the website | Check the file is in the exact folder shown in the admin (for example `images/gallery/2025/`) and the name matches exactly, including capital letters. |
| Admin says "Incorrect password" | Check the password in `admin/admin.js` (Part 3). |
| Changes disappeared | You may be on a different browser or computer. Import the live `site-data.json` (Part 4.7). |
| Website shows old content | Wait 2–5 minutes, then press Ctrl+F5 (Cmd+Shift+R on Mac) to refresh. |
| Reel doesn't show | The Instagram account must be public, and the link must be a reel or post link. Instagram can take a few seconds to load the embed. |
| Logo doesn't show | Save your logo as `images/rc-logo.png` (PNG, square works best). |
| Telugu or Devanagari text looks wrong | Check your internet connection (fonts load from Google Fonts). |

---

## Part 10: Checklist before going live

- [ ] Changed the admin password in `admin/admin.js`
- [ ] Chosen colours in the Colours & Music tab
- [ ] Uploaded the background music to `audio/` (optional)
- [ ] Replaced the hero banner with a real Ganesha festival image
- [ ] Removed the sample photos and quotes you don't want (Photos, Hero & Quotes tabs)
- [ ] Put your logo file at `images/rc-logo.png` (the header and footer use it)
- [ ] Added the current year and at least one photo per event
- [ ] Checked the contact details in `data/site-data.json` (Instagram @rc_center_official and rccenterofficial@gmail.com are already set; add a phone number if you want one shown)
- [ ] Tested on a mobile phone (open the link and check the menu, gallery and lightbox)
- [ ] Shared the website link and admin link only with trusted team members

Jai Ganesh! గణపతి బప్పా మోరియా!
