
import json

speaking_metrics = {
    "wpm": 120.0,
    "average_gap_between_words_ms": 0,
    "pause_after_last_word": False,
    "sentence_word_count": 16
}

wpm = speaking_metrics["wpm"]
hold_frames = 0
reasoning_parts = []

if wpm > 160:
    hold_frames = 1
    reasoning_parts.append("Fast speaking ({} WPM).".format(wpm))
elif wpm >= 120:
    hold_frames = 4
    reasoning_parts.append("Normal speaking ({} WPM).".format(wpm))
else:
    hold_frames = 8
    reasoning_parts.append("Slow speaking ({} WPM).".format(wpm))

if speaking_metrics["pause_after_last_word"]:
    extra_frames = 4
    hold_frames += extra_frames
    reasoning_parts.append("Pause detected at end (added {} frames).".format(extra_frames))

final_output = {
    "holdFrames": int(hold_frames),
    "reasoning": " ".join(reasoning_parts)
}

print(json.dumps(final_output))
