import { TargetEmotion, getEmotionColor } from "@/src/lib/storyflow/script-builder-types";
import { cn } from "@/src/lib/storyflow/utils";

interface EmotionBadgeProps {
  emotion: TargetEmotion;
  className?: string;
}

export function EmotionBadge({ emotion, className }: EmotionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
        getEmotionColor(emotion),
        className
      )}
    >
      {emotion}
    </span>
  );
}
