import { Linking, Platform } from 'react-native';

export function navigateTo(lat: number, lng: number) {
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lng}&dirflg=d`,
    android: `google.navigation:q=${lat},${lng}`,
    default: fallback,
  })!;

  Linking.canOpenURL(url).then((supported) => {
    Linking.openURL(supported ? url : fallback);
  });
}
