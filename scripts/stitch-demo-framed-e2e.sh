#!/usr/bin/env bash
# End-to-end demo cut: Iris cover → Home (fresh) → iPhone-framed iOS beats → arch → outro.
# No web B-roll. Uses device-frame assets (ios-stage-bg + iphone-frame PNGs).
#
# Usage:
#   bash scripts/stitch-demo-framed-e2e.sh
#   IOS_HOME_CLIP=~/Movies/home.mp4 bash scripts/stitch-demo-framed-e2e.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLIPS="$ROOT/docs/demo-video-clips"
OUT_DIR="$ROOT/docs/demo-video-output"
FRAME_DIR="$OUT_DIR/device-frame"
WORK="$OUT_DIR/_work-framed"
SLATES="$OUT_DIR/_work"
SRC="${IRIS_DEMO_SOURCE:-$HOME/Downloads/ScreenRecording_06-09-2026 21-09-51_1.MP4}"
COVER="$OUT_DIR/cover-final.png"
FINAL="$OUT_DIR/iris-demo-framed-e2e.mp4"
IOS_HOME_CLIP="${IOS_HOME_CLIP:-$WORK/ios-home-fresh.mp4}"

# Default: darkened/blurred camper-van photo stage (cover continuity).
# Revert to plain: IRIS_STAGE_BG="$FRAME_DIR/ios-stage-bg.png"
STAGE_BG="${IRIS_STAGE_BG:-$FRAME_DIR/ios-stage-bg-photo.png}"
IPHONE_FRAME="$FRAME_DIR/iphone-frame.png"

# Screen window in 1080p coords (matches device-frame HTML + edit map)
SCR_W=452
SCR_H=980
SCR_X=734
SCR_Y=50

mkdir -p "$WORK"

[[ -f "$STAGE_BG" && -f "$IPHONE_FRAME" ]] || {
  echo "→ Rendering device-frame PNGs"
  node "$FRAME_DIR/render-two.mjs"
}

echo "→ Stage intro / outro slates"
python3 "$ROOT/scripts/make-stage-title-cards.py"

# Portrait screen recording → centered in iPhone bezel on branded stage
# frame_ios <out> <duration_sec> <ffmpeg input args…>
frame_ios() {
  local out="$1" dur="$2"
  shift 2
  ffmpeg -y "$@" \
    -loop 1 -i "$STAGE_BG" \
    -loop 1 -i "$IPHONE_FRAME" \
    -filter_complex "
      [0:v]scale=${SCR_W}:${SCR_H}:force_original_aspect_ratio=increase,crop=${SCR_W}:${SCR_H},setsar=1[scr];
      [1:v]scale=1920:1080,format=rgba[bg];
      [2:v]scale=1920:1080,format=rgba[frm];
      [bg][scr]overlay=${SCR_X}:${SCR_Y}:format=auto[tmp];
      [tmp][frm]overlay=0:0:format=auto,format=yuv420p[out]
    " \
    -map "[out]" -map 0:a? \
    -t "$dur" -c:v libx264 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 128k \
    "$out"
}

kb() { local secs=$1; echo "zoompan=z='min(zoom+0.0004,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((secs * 30)):s=1920x1080:fps=30"; }

still_on_stage() {
  local img="$1" out="$2" dur="$3"
  ffmpeg -y -loop 1 -i "$STAGE_BG" -loop 1 -i "$img" -t "$dur" \
    -filter_complex "
      [0:v]scale=1920:1080[bg];
      [1:v]scale=1400:-1:force_original_aspect_ratio=decrease[sl];
      [bg][sl]overlay=(W-w)/2:(H-h)/2,format=yuv420p,$(kb "$dur")[out]
    " \
    -map "[out]" -an -c:v libx264 -pix_fmt yuv420p -r 30 \
    "$out"
}

still_slate() {
  local img="$1" out="$2" dur="$3"
  ffmpeg -y -loop 1 -i "$img" -t "$dur" \
    -vf "scale=1920:1080,$(kb "$dur")" -c:v libx264 -pix_fmt yuv420p -r 30 -an \
    "$out"
}

[[ -f "$SRC" ]] || { echo "ERROR: missing source $SRC" >&2; exit 1; }
[[ -f "$COVER" ]] || { echo "ERROR: missing cover $COVER" >&2; exit 1; }

echo "→ 00 Iris cover page (6s, Ken Burns on camper van hero)"
still_slate "$COVER" "$WORK/00-cover.mp4" 6

if [[ -f "$IOS_HOME_CLIP" ]]; then
  echo "→ 01 iOS Home dashboard (6s, framed) — $IOS_HOME_CLIP"
  frame_ios "$WORK/01-home-framed.mp4" 6 -i "$IOS_HOME_CLIP"
  HAS_HOME=1
else
  echo "→ 01 iOS Home — SKIPPED (record 6s Home, save as $IOS_HOME_CLIP)"
  HAS_HOME=0
fi

echo "→ Hook — Find a strong subject (6s, framed)"
frame_ios "$WORK/02-hook-framed.mp4" 6 -ss 227 -i "$SRC"

echo "→ Practice assignment (8s, framed)"
frame_ios "$WORK/03-assignment-framed.mp4" 8 -i "$CLIPS/01-practice-assignment.mp4"

echo "→ 04a Coaching — grass tip (8s, framed)"
frame_ios "$WORK/04a-coach-a-framed.mp4" 8 -ss 227 -i "$SRC"

echo "→ 04b Coaching — tree → green → shutter (24s, framed)"
frame_ios "$WORK/04b-coach-b-framed.mp4" 24 -ss 279 -i "$SRC"

echo "→ 05 Analyzing (10s, framed)"
frame_ios "$WORK/05-analyzing-framed.mp4" 10 -ss 295 -i "$SRC"

echo "→ 06 Critique / Glass Box (29s, framed)"
frame_ios "$WORK/06-critique-framed.mp4" 29 -i "$CLIPS/03-critique-glassbox-complete.mp4"

echo "→ 07 Architecture — 9 agents (12s)"
still_on_stage "$OUT_DIR/arch-slide-9agents.png" "$WORK/07-arch-9agents.mp4" 12

echo "→ 08 Architecture — /health proof (12s)"
still_on_stage "$ROOT/docs/devpost-public/proof-04-stack-health.png" "$WORK/08-arch-health.mp4" 12

echo "→ 09 Outro slate (8s)"
still_slate "$SLATES/outro-stage-slate.png" "$WORK/09-outro.mp4" 8

echo "→ Concat"
if [[ "$HAS_HOME" == 1 ]]; then
  cat > "$WORK/concat.txt" <<EOF
file '$WORK/00-cover.mp4'
file '$WORK/01-home-framed.mp4'
file '$WORK/02-hook-framed.mp4'
file '$WORK/03-assignment-framed.mp4'
file '$WORK/04a-coach-a-framed.mp4'
file '$WORK/04b-coach-b-framed.mp4'
file '$WORK/05-analyzing-framed.mp4'
file '$WORK/06-critique-framed.mp4'
file '$WORK/07-arch-9agents.mp4'
file '$WORK/08-arch-health.mp4'
file '$WORK/09-outro.mp4'
EOF
else
  cat > "$WORK/concat.txt" <<EOF
file '$WORK/00-cover.mp4'
file '$WORK/02-hook-framed.mp4'
file '$WORK/03-assignment-framed.mp4'
file '$WORK/04a-coach-a-framed.mp4'
file '$WORK/04b-coach-b-framed.mp4'
file '$WORK/05-analyzing-framed.mp4'
file '$WORK/06-critique-framed.mp4'
file '$WORK/07-arch-9agents.mp4'
file '$WORK/08-arch-health.mp4'
file '$WORK/09-outro.mp4'
EOF
fi
ffmpeg -y -f concat -safe 0 -i "$WORK/concat.txt" -c copy "$FINAL" 2>/dev/null

# iOS-only sidecar (no intro slate / arch / outro)
cat > "$WORK/concat-ios-framed.txt" <<EOF
file '$WORK/02-hook-framed.mp4'
file '$WORK/03-assignment-framed.mp4'
file '$WORK/04a-coach-a-framed.mp4'
file '$WORK/04b-coach-b-framed.mp4'
file '$WORK/05-analyzing-framed.mp4'
file '$WORK/06-critique-framed.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$WORK/concat-ios-framed.txt" -c copy \
  "$OUT_DIR/iris-demo-ios-framed.mp4" 2>/dev/null

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL")
IOS_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/iris-demo-ios-framed.mp4")

echo ""
echo "Done: $FINAL"
printf "Total: %.0fs (~%.1f min)\n" "$DUR" "$(python3 -c "print(round($DUR/60,1))")"
printf "iOS framed only: %.0fs\n" "$IOS_DUR"
echo "Preview: open $FINAL"
