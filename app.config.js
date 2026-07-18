
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getAppName = () => {
  if (IS_DEV) return "HomeCircle (Dev)";
  if (IS_PREVIEW) return "HomeCircle (Preview)";
  return "HomeCircle";
};

const getBundleIdentifier = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  if (IS_PREVIEW) return "com.amie.HomeCircle.preview";
  return "com.amie.HomeCircle";
};

const getPackageName = () => {
  if (IS_DEV) return "com.amie.HomeCircle.dev";
  if (IS_PREVIEW) return "com.amie.HomeCircle.preview";
  return "com.amie.HomeCircle";
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
    backgroundColor: "#208AEF",
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
    "googleServicesFile": process.env.GOOGLE_SERVICES_JSON
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
        backgroundColor: "#208AEF",
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