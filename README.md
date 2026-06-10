# ⚽ ICTU Football Madness

A live prediction competition platform with a rat-race leaderboard, admin panel, automated score syncing, and email updates.

---

## What you get

| Feature | Details |
|---|---|
| 🏁 Live rat-race dashboard | Public URL, updates every 5 min, confetti for the leader |
| 👑 Animated leaderboard | Avatars (photos or initials), rank badges, accuracy stats |
| 📤 Admin upload panel | Drag-and-drop Excel prediction files |
| 👥 Participant management | Add emails, upload photos, mark jackpot payment |
| ⚡ Auto score sync | Cron job pulls live results from API-Football every 5 min |
| 📧 Email updates | One-click sends personalised standings to all participants |
| 🏆 Multi-competition | World Cup, Euros, UCL — new competition per event |

---

## Setup (one-time, ~20 minutes)

### 1. Get the code onto GitHub

1. Create a new repo on [github.com](https://github.com/new) — call it `ictu-football-madness`
2. In the project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ictu-football-madness.git
   git push -u origin main
   ```

---

### 2. Set up Supabase (free database)

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a name (e.g. `ictu-football-madness`) and a strong password. Save the password!
3. Once created, go to **SQL Editor** → **New query**
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Storage** → **New bucket** → name it `avatars`, tick **Public bucket** → Create
6. Go to **Settings** → **API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

---

### 3. Get an API-Football key (free live scores)

1. Go to [rapidapi.com/api-sports/api/api-football](https://rapidapi.com/api-sports/api/api-football)
2. Sign up for the **Basic (free)** plan — 100 requests/day, enough for the competition
3. Copy your API key → `API_FOOTBALL_KEY`

---

### 4. Set up SendGrid (free emails)

1. Go to [sendgrid.com](https://sendgrid.com) → Sign up free (100 emails/day)
2. Go to **Settings** → **API Keys** → **Create API Key** (Full Access)
3. Copy the key → `SENDGRID_API_KEY`
4. Verify your sender email in **Settings** → **Sender Authentication**
5. Put your verified email in `SENDGRID_FROM_EMAIL`

---

### 5. Deploy to Vercel (free hosting)

1. Go to [vercel.com](https://vercel.com) → New project → Import from GitHub
2. Select your `ictu-football-madness` repo
3. In **Environment Variables**, add all variables from `.env.local.example`:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase step 6 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase step 6 |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase step 6 |
   | `API_FOOTBALL_KEY` | From RapidAPI step 3 |
   | `SENDGRID_API_KEY` | From SendGrid step 2 |
   | `SENDGRID_FROM_EMAIL` | Your verified email |
   | `SENDGRID_FROM_NAME` | `ICTU Football Madness` |
   | `ADMIN_PASSWORD` | A strong password of your choice |
   | `CRON_SECRET` | Any random string (e.g. `abc123xyz`) |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://ictu-football-madness.vercel.app`) |

4. Click **Deploy** → wait ~2 minutes

---

## Running a competition

### Create a competition

1. Go to `https://your-app.vercel.app/admin` → sign in
2. Click **Competitions** → **New competition**
3. Fill in: Name (`World Cup 2026`), slug (`wc2026`), dates, scoring rules
4. Click **Create competition**

Your public dashboard is now live at: `https://your-app.vercel.app/dashboard/wc2026`
**Share this link with all participants!**

---

### Upload predictions

1. Ask each participant to fill in their Excel file and send it to you
2. **Rename each file** to: `Group_Stage_Predictions_FirstName_LastName.xlsx`
3. Go to **Admin** → **Upload predictions**
4. Select the competition, drop all files at once → **Upload**

Participants are created automatically. Their predicted scores are imported immediately.

---

### Manage participants

Go to **Admin** → **Participants** to:
- **Add email addresses** — click the email field next to any participant
- **Upload photos** — click the avatar circle to replace initials with a real photo
- **Mark jackpot payment** — click the 💸 button when someone pays their €5

---

### After each matchday

Scores update automatically every 5 minutes via the Vercel cron job.

To send standings emails manually:
1. Go to **Admin** (main page)
2. Click **📧 Email standings** next to the competition

---

## Adding a new competition (next year)

Just repeat "Create a competition" above with the new event name and slug. All history is preserved. The same dashboard URL pattern applies: `/dashboard/euros2028`, `/dashboard/ucl2026`, etc.

---

## Excel file format

Participants fill in the template file and send it back. The filename determines their name:
- `Group_Stage_Predictions_John_Smith.xlsx` → participant "John Smith"
- `Group_Stage_Predictions_Maria.xlsx` → participant "Maria"

The parser reads:
- Column E/F (Score) → predicted home/away goals
- Column I (Winner) → tournament winner pick
- Row 4, Column J → golden boot pick

---

## Scoring

| Prediction | Points |
|---|---|
| Exact score + correct result | 5 pts |
| Correct result only (W/D/L) | 3 pts |
| Correct tournament winner | 10 pts |
| Correct golden boot | 10 pts |

Configurable per competition in the admin panel.
