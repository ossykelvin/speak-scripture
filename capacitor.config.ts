import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID ?? "com.koptechnology.speakscripture",
  appName: process.env.CAPACITOR_APP_NAME ?? "Speak Scripture",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
