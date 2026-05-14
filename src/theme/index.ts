export const GREEN = '#5EC26A';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: {
    bg: string;
    bg2: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    text2: string;
    text3: string;
  };
}

const LIGHT_COLORS: Theme['colors'] = {
  bg: '#fafafa',
  bg2: '#f0f0f0',
  surface: '#ffffff',
  surface2: '#f5f5f5',
  border: 'rgba(0,0,0,0.08)',
  text: '#111111',
  text2: '#555555',
  text3: '#999999',
};

const DARK_COLORS: Theme['colors'] = {
  bg: '#111111',
  bg2: '#1c1c1e',
  surface: '#1c1c1e',
  surface2: '#2c2c2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f0',
  text2: '#aaaaaa',
  text3: '#666666',
};

export const LIGHT_THEME: Theme = { scheme: 'light', colors: LIGHT_COLORS };
export const DARK_THEME: Theme = { scheme: 'dark', colors: DARK_COLORS };

// Google Maps dark style matching the hi-fi map-bg
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#38383a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#484848' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
