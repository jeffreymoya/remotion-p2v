import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";

// Load fonts used in video.config.json emphasis settings
export const montserrat = loadMontserrat();
export const roboto = loadRoboto();

// Export for convenience - default to Montserrat for high emphasis
export const { fontFamily } = montserrat;
