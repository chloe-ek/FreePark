const LOCATION_PERMISSION_TEXT =
  'FreePark uses your location to show free parking meters near you.';

module.exports = {
  expo: {
    name: 'FreePark-expo',
    slug: 'FreePark-expo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.chloe-ek.FreePark-expo',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: LOCATION_PERMISSION_TEXT,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      package: 'com.chloeek.FreeParkexpo',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: LOCATION_PERMISSION_TEXT,
        },
      ],
    ],
  },
};
