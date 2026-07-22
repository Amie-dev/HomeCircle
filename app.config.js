const fs = require("fs");
const path = require("path");

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getAppName = () => {
  if (IS_DEV) return "HomeCircle (Dev)";
  if (IS_PREVIEW) return "HomeCircle";
  return "HomeCircle";
};

const getBundleIdentifier = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  if (IS_PREVIEW) return "com.amie.HomeCircle";
  return "com.amie.HomeCircle";
};

const getPackageName = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  if (IS_PREVIEW) return "com.amie.HomeCircle";
  return "com.amie.HomeCircle";
};

const getGoogleServiceJSON = () => {
  const envValue = IS_DEV ? process.env.GOOGLE_SERVICES_JSON : process.env.GOOGLE_SERVICES_JSON_PRE;
  
  if (envValue) {
    // If it looks like JSON content, write it to a file
    if (envValue.trim().startsWith('{')) {
      const fileName = IS_DEV ? 'google-services.json' : 'google-services-pre-prod.json';
      const filePath = path.resolve(__dirname, fileName);
      try {
        fs.writeFileSync(filePath, envValue.trim());
        return `./${fileName}`;
      } catch (err) {
        console.error(`Failed to write ${fileName} from environment variable:`, err);
      }
    } else {
      // Otherwise, assume it's already a file path
      return envValue;
    }
  }

  // Fallback to local files if env var is empty/not set
  return IS_DEV ? "./google-services.json" : "./google-services-pre-prod.json";
};

const config = {
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
    backgroundColor: "#4e6d8a",
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
        cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
        recordAudioAndroid: true,
        barcodeScannerEnabled: true,
      },
    ],
  ],
  updates: {
    url: "https://u.expo.dev/134e5fe6-7adb-45e4-91ea-18aea3f94795",
  },

  runtimeVersion: {
    policy: "appVersion",
  },

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    router: {},
    eas: {
      projectId: "134e5fe6-7adb-45e4-91ea-18aea3f94795",
    },
  },

  owner: "amie.code",
};

module.exports = config;
