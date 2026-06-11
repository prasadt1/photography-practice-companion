#!/usr/bin/env bash
# Trim web B-roll screen recording to ~59s with smooth in-flow cuts + audio.
#
# Usage:
#   bash scripts/stitch-web-demo.sh
#   CLIP=~/Desktop/rec.mov bash scripts/stitch-web-demo.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/docs/demo-video-output/_work-web"
OUT="$ROOT/docs/demo-video-output/iris-demo-web-broll.mp4"

CLIP="${CLIP:-$WORK/web-raw-3.mov}"

mkdir -p "$WORK/segments"

# Normalize video + keep audio (AAC stereo)
norm() {
  local in="$1" out="$2" ss="$3" dur="$4"
  ffmpeg -y -loglevel error -ss "$ss" -i "$in" -t "$dur" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps=30" \
    -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 128k -ar 48000 -ac 2 \
    "$out"
}

echo "→ Segment 1: Home hero (3s)"
norm "$CLIP" "$WORK/segments/01-home-hero.mp4" 0 3

echo "→ Segment 2: Smooth scroll — hero → at-a-glance → contact (7s)"
norm "$CLIP" "$WORK/segments/02-scroll-contact.mp4" 6 7

echo "→ Segment 3: Contact scroll down toward growth (3s)"
norm "$CLIP" "$WORK/segments/03-contact-growth.mp4" 22 3

echo "→ Segment 4: Growth comparison → Ask mentor hover/click → mentor landing (9s)"
norm "$CLIP" "$WORK/segments/04-ask-mentor-cta.mp4" 37 9

echo "→ Segment 5: Mentor landing → type question → send (6s)"
norm "$CLIP" "$WORK/segments/05-mentor-question.mp4" 47 6

echo "→ Segment 6: Loading — YOU ASKED + progress (3s)"
norm "$CLIP" "$WORK/segments/06-mentor-load.mp4" 55 3

echo "→ Segment 7: Mentor answer (5s)"
norm "$CLIP" "$WORK/segments/07-mentor-answer.mp4" 75 5

echo "→ Segment 8: Listen — TTS playing (4s)"
norm "$CLIP" "$WORK/segments/08-mentor-listen.mp4" 86 4

echo "→ Segment 9: Post-listen — mentor answer screen, sidebar visible (3s)"
norm "$CLIP" "$WORK/segments/09-mentor-bridge.mp4" 96 3

echo "→ Segment 10: Settings → Working pro → Print Sales nav (6s)"
norm "$CLIP" "$WORK/segments/10-settings-print-nav.mp4" 122 6

echo "→ Segment 11: Print Sales proposals (3s)"
norm "$CLIP" "$WORK/segments/11-print-proposals.mp4" 133 3

echo "→ Segment 12: Approve camper + success (4s)"
norm "$CLIP" "$WORK/segments/12-print-approve.mp4" 137 4

echo "→ Segment 13: My Work — listed for sale (3s)"
norm "$CLIP" "$WORK/segments/13-listed-mywork.mp4" 155 3

cat > "$WORK/concat-web.txt" <<EOF
file '$WORK/segments/01-home-hero.mp4'
file '$WORK/segments/02-scroll-contact.mp4'
file '$WORK/segments/03-contact-growth.mp4'
file '$WORK/segments/04-ask-mentor-cta.mp4'
file '$WORK/segments/05-mentor-question.mp4'
file '$WORK/segments/06-mentor-load.mp4'
file '$WORK/segments/07-mentor-answer.mp4'
file '$WORK/segments/08-mentor-listen.mp4'
file '$WORK/segments/09-mentor-bridge.mp4'
file '$WORK/segments/10-settings-print-nav.mp4'
file '$WORK/segments/11-print-proposals.mp4'
file '$WORK/segments/12-print-approve.mp4'
file '$WORK/segments/13-listed-mywork.mp4'
EOF

echo "→ Concat (re-encode for clean A/V sync)"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/concat-web.txt" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  "$OUT"

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT")
printf "Done: %s (%.1fs)\n" "$OUT" "$DUR"
