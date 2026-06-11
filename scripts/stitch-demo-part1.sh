#!/usr/bin/env bash
# Stitch iOS demo Part 1 + architecture ender (no web B-roll yet).
#
# Coaching arc — two segments from the raw recording joined with a straight cut:
#   Seg A: raw 227–235s  → grass "Find a strong subject" (8s)
#   Seg B: raw 279–303s  → tree pan + "Fill frame with tree" + green "Ready to capture" + analyze (24s)
#
# Beat budget: hook 6s | home 0s (record separately) | practice 8s | coach 32s | critique 29s
#              arch 21s | end card 5s  → Part 1 total: ~1:41
#
# Usage:
#   bash scripts/stitch-demo-part1.sh
#   IRIS_DEMO_SOURCE=/path/to/recording.MP4 bash scripts/stitch-demo-part1.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLIPS="$ROOT/docs/demo-video-clips"
FRAMES="$ROOT/docs/demo-video-frames"
STILLS="$ROOT/docs/devpost-public"
OUT_DIR="$ROOT/docs/demo-video-output"
WORK="$OUT_DIR/_work"
SRC="${IRIS_DEMO_SOURCE:-$HOME/Downloads/ScreenRecording_06-09-2026 21-09-51_1.MP4}"
FINAL="$OUT_DIR/iris-demo-part1-ios-and-architecture.mp4"

mkdir -p "$WORK" "$OUT_DIR"

# Portrait iPhone → blurred-background letterbox (beats flat black bars)
PORTRAIT_VF='[0:v]split=2[fg][bg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=20:5[blurred];[fg]scale=-2:1080[scaled];[blurred][scaled]overlay=(W-w)/2:(H-h)/2,setsar=1'

# Still → 1920×1080 fit (for arch slides)
STILL_VF='scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f0f12,setsar=1'

# Ken Burns subtle zoom — pass duration as arg
kb() { local secs=$1; echo "zoompan=z='min(zoom+0.0008,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((secs * 30)):s=1920x1080:fps=30"; }

echo "→ Title + architecture cards (fixes: Gemini 3.1 Pro, motion hook)"
python3 "$ROOT/scripts/make-demo-title-cards.py"

# ── Intro: 6s from the "Find a strong subject" frame with Ken Burns
# Uses the verified grass frame (t0227.jpg) as a warm golden still
# If iOS Home screen-record exists, swap in that clip instead.
IOS_HOME_CLIP="$WORK/ios-home-fresh.mp4"
if [[ -f "$IOS_HOME_CLIP" ]]; then
  echo "→ Hook: iOS Home screen-record (pre-recorded)"
  ffmpeg -y -i "$IOS_HOME_CLIP" -t 6 \
    -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
    "$WORK/00-hook.mp4" 2>/dev/null
else
  echo "→ Hook: grass 'Find a strong subject' frame (raw 227–233s)"
  if [[ ! -f "$SRC" ]]; then
    echo "ERROR: source recording not found: $SRC" >&2
    echo "Set IRIS_DEMO_SOURCE or place a clip at $IOS_HOME_CLIP" >&2
    exit 1
  fi
  ffmpeg -y -ss 227 -i "$SRC" -t 6 \
    -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
    "$WORK/00-hook.mp4" 2>/dev/null
fi

echo "→ Clip 01 — Practice tab / assignment (8s)"
ffmpeg -y -i "$CLIPS/01-practice-assignment.mp4" -t 8 \
  -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
  "$WORK/01-assignment.mp4" 2>/dev/null

echo "→ Coaching seg A — grass 'Find a strong subject' (raw 227–235s, 8s)"
ffmpeg -y -ss 227 -i "$SRC" -t 8 \
  -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
  "$WORK/02a-coach-findsubject.mp4" 2>/dev/null

echo "→ Coaching seg B — pan → green → tap → analyze (raw 279–303s, 24s)"
ffmpeg -y -ss 279 -i "$SRC" -t 24 \
  -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
  "$WORK/02b-coach-green.mp4" 2>/dev/null

echo "→ Analyzing beat (raw 295–305s, 10s)"
ffmpeg -y -ss 295 -i "$SRC" -t 10 \
  -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
  "$WORK/02c-analyzing.mp4" 2>/dev/null

# Save the full coaching arc as a reusable clip
cat > "$WORK/coach-concat.txt" <<EOF
file '$WORK/02a-coach-findsubject.mp4'
file '$WORK/02b-coach-green.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$WORK/coach-concat.txt" -c copy \
  "$CLIPS/02-tree-coach-full-arc.mp4" 2>/dev/null
echo "   saved: docs/demo-video-clips/02-tree-coach-full-arc.mp4"

echo "→ Clip 03 — Critique / Glass Box (29s)"
ffmpeg -y -i "$CLIPS/03-critique-glassbox-complete.mp4" -t 29 \
  -filter_complex "$PORTRAIT_VF" -map 0:a? -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k \
  "$WORK/03-critique.mp4" 2>/dev/null

echo "→ Architecture: 9-agents slide (7s, Ken Burns)"
ffmpeg -y -loop 1 -i "$OUT_DIR/arch-slide-9agents.png" -t 7 \
  -vf "$(kb 7)" -c:v libx264 -pix_fmt yuv420p -r 30 -an \
  "$WORK/04-arch-9agents.mp4" 2>/dev/null

echo "→ Architecture: Live Stack Flags /health proof (7s, Ken Burns)"
ffmpeg -y -loop 1 -i "$STILLS/proof-04-stack-health.png" -t 7 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f0f12,setsar=1,$(kb 7)" \
  -c:v libx264 -pix_fmt yuv420p -r 30 -an \
  "$WORK/05-arch-health.mp4" 2>/dev/null

echo "→ Architecture: Glass Box annotated panel (7s, Ken Burns)"
ffmpeg -y -loop 1 -i "$WORK/arch-02-glassbox.png" -t 7 \
  -vf "$(kb 7)" -c:v libx264 -pix_fmt yuv420p -r 30 -an \
  "$WORK/06-arch-glassbox.mp4" 2>/dev/null

echo "→ End card (5s, Ken Burns)"
ffmpeg -y -loop 1 -i "$WORK/outro-card.png" -t 5 \
  -vf "$(kb 5)" -c:v libx264 -pix_fmt yuv420p -r 30 -an \
  "$WORK/07-outro.mp4" 2>/dev/null

echo "→ Concat: full Part 1 draft"
cat > "$WORK/concat.txt" <<EOF
file '$WORK/00-hook.mp4'
file '$WORK/01-assignment.mp4'
file '$WORK/02a-coach-findsubject.mp4'
file '$WORK/02b-coach-green.mp4'
file '$WORK/02c-analyzing.mp4'
file '$WORK/03-critique.mp4'
file '$WORK/04-arch-9agents.mp4'
file '$WORK/05-arch-health.mp4'
file '$WORK/06-arch-glassbox.mp4'
file '$WORK/07-outro.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$WORK/concat.txt" -c copy "$FINAL" 2>/dev/null

echo "→ Sidecar: iOS-only segment"
cat > "$WORK/concat-ios-only.txt" <<EOF
file '$WORK/00-hook.mp4'
file '$WORK/01-assignment.mp4'
file '$WORK/02a-coach-findsubject.mp4'
file '$WORK/02b-coach-green.mp4'
file '$WORK/02c-analyzing.mp4'
file '$WORK/03-critique.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$WORK/concat-ios-only.txt" -c copy \
  "$OUT_DIR/iris-demo-ios-only.mp4" 2>/dev/null

echo "→ Sidecar: architecture + outro"
cat > "$WORK/concat-arch-outro.txt" <<EOF
file '$WORK/04-arch-9agents.mp4'
file '$WORK/05-arch-health.mp4'
file '$WORK/06-arch-glassbox.mp4'
file '$WORK/07-outro.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$WORK/concat-arch-outro.txt" -c copy \
  "$OUT_DIR/iris-demo-architecture-outro.mp4" 2>/dev/null

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL")
IOS_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/iris-demo-ios-only.mp4")
echo ""
echo "Done: $FINAL"
printf "Duration: %.0fs\n" "$DUR"
printf "iOS section: %.0fs  (hook 6 + practice 8 + coach-A 8 + coach-B 24 + analyzing 10 + critique 29)\n" "$IOS_DUR"
echo ""
echo "Coaching arc:"
echo "  Seg A raw 227–235s: grass + 'Find a strong subject' (t0227.jpg)"
echo "  Seg B raw 279–303s: tree + 'Fill frame with tree' + GREEN + tap + analyze"
echo ""
echo "Web B-roll slot: insert iris-demo-ios-only → [web ~55s] → architecture-outro"
echo "Accuracy: arch slide shows Gemini 3.1 Pro + 9 agents (no 'Gemini Live')"
