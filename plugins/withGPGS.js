/**
 * Expo Config Plugin for react-native-google-leaderboards-and-achievements.
 *
 * Adds the Play Games project ID to AndroidManifest.xml and ensures
 * the native module is properly linked.
 */

const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

function withGPGS(config, { projectId }) {
  if (!projectId) {
    console.warn('[withGPGS] No projectId provided. GPGS will not work.');
    return config;
  }

  // Add Play Games metadata to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) return config;

    // Ensure meta-data array exists
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Add com.google.android.gms.games.APP_ID
    const existingMeta = application['meta-data'].find(
      (m) => m.$?.['android:name'] === 'com.google.android.gms.games.APP_ID'
    );

    if (!existingMeta) {
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.android.gms.games.APP_ID',
          'android:value': `\\u0003${projectId}`,
        },
      });
    }

    return config;
  });

  // Add play-services-games-v2 dependency to build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    if (!buildGradle.includes('play-services-games-v2')) {
      config.modResults.contents = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "com.google.android.gms:play-services-games-v2:+"`
      );
    }

    return config;
  });

  return config;
}

module.exports = withGPGS;
