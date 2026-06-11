# Re-recording the iOS Home beat (after bad seed data)

## What went wrong

The Home clip in your field recording shows a **highway/road photo** with the caption **"still-life on wood"**. That was demo seed metadata pasted onto an Unsplash road image — not your real library.

**Good news:** your MongoDB account now has only **3 real photos** (tree, glacier, oak), all with correct descriptions. The bad 16-photo library state is gone.

## The clock/time problem — don't worry about it

You do **not** need to re-record the coaching clips. Only record a **new 6-second Home clip**.

| Concern | Reality |
|---------|---------|
| Home shows 21:10, Shoot shows 21:13 | Fine — same evening, 3 minutes apart. Judges won't notice. |
| Cover page has no status bar | Even better — the crossfade **from cover → Home** hides any jump. |
| Want zero status bar | Optional: we can crop the top 90px in post on all iOS clips (not required). |

## What Home should show now

After the hero-picker fix (recent golden-hour upload wins), Home should show your **tree shot** with:

- Image: backlit tree at golden hour  
- Caption: matches the image (vertical landscape, tree, field…)  
- Score: ~6.5 / 10  

Rebuild/reinstall the iOS app if needed so it picks up the hero logic change.

## Record the Home clip (6 seconds)

1. Open Iris on iPhone → **Home** tab  
2. Confirm hero = **tree** (not glacier, not road)  
3. Screen record **6 seconds** — slow scroll optional, or hold still on hero + progress  
4. Save as:

```text
docs/demo-video-output/_work-framed/ios-home-fresh.mp4
```

Or pass any path:

```bash
IOS_HOME_CLIP=~/Downloads/home-beat.mp4 bash scripts/stitch-demo-framed-e2e.sh
```

## Video flow (updated stitch)

| Beat | Source |
|------|--------|
| 0:00–0:06 | **Iris cover page** (camper van hero — `cover-final.png`) |
| 0:06–0:12 | **iOS Home** (your fresh 6s clip, iPhone frame) |
| 0:12+ | Existing field recording (Practice → coach → critique) — unchanged |
| … | Architecture + outro |

The cover → Home edit tells the story: *marketing hero (journey/light) → your real library remembered on device → field coaching*.

## Do NOT re-seed stock photos before recording

`seed-library-stock.py` was for **web** contact-sheet B-roll only. Don't run it on the iPhone account before Home record — it can reintroduce mismatched hero candidates.

## Re-stitch after Home clip

```bash
bash scripts/stitch-demo-framed-e2e.sh
open docs/demo-video-output/iris-demo-framed-e2e.mp4
```
