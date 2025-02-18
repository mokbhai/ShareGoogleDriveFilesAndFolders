const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidPdfConfig(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    mainApplication.$["android:requestLegacyExternalStorage"] = "true";

    return config;
  });
}; 