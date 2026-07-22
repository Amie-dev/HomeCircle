const fs = require("fs");
const path = require("path");

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const EAS_PROJECT_ID = "23b28d05-1f10-4034-a9cf-4fc3981657eb";

const getAppName = () => {
  if (IS_DEV) return "HomeCircle (Dev)";
  if (IS_PREVIEW) return "HomeCircle";
  return "HomeCircle";
};

const getBundleIdentifier = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  return "com.amie.HomeCircle";
};

const getPackageName = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  return "com.amie.HomeCircle";
};

const getGoogleServiceJSON = () => {
  const envValue = IS_DEV
    ? process.env.GOOGLE_SERVICES_JSON
    : process.env.GOOGLE_SERVICES_JSON_PRE;

  if (envValue) {
    // Environment variable contains JSON
    if (envValue.trim().startsWith("{")) {
      const fileName = IS_DEV
        ? "google-services.json"
        : "google-services-pre-prod.json";

      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, envValue);

      return filePath;
    }

    // Environment variable contains a file path
    return envValue;
  }

  // Local fallback
  return IS_DEV
    ? "./google-services.json"
    : "./google-services-pre-prod.json";
};

module.exports = {
  name: getAppName(),
  slug: "HomeCircle",
  version: "1.0.0",

  orientation: "portrait",
  scheme: "HomeCircle",

  userInterfaceStyle: "automatic",

  icon: "./assets/images/icon.png",

  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },

  ios: {
    bundleIdentifier: getBundleIdentifier(),
    supportsTablet: true,
    icon: "./assets/images/icon.png",
  },

  android: {
    package: getPackageName(),

    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
      backgroundColor: "#E6F4FE",
    },

    predictiveBackGestureEnabled: false,

    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],

    googleServicesFile: getGoogleServiceJSON(),
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    "expo-notifications",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#eaf1fb",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow $(PRODUCT_NAME) to access your camera",
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone",
        recordAudioAndroid: true,
        barcodeScannerEnabled: true,
      },
    ],
  ],

  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
  },

  runtimeVersion: {
    policy: "appVersion",
  },

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },

  owner: "code.amie",
};