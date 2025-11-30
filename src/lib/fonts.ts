import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadBreeSerif } from "@remotion/google-fonts/BreeSerif";

// Load fonts used in video.config.json emphasis settings
export const bebasNeue = loadBebasNeue();
export const breeSerif = loadBreeSerif();

// Export for convenience - default to Bebas Neue for high emphasis
export const { fontFamily } = bebasNeue;
