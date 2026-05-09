import type { ResolvedPlace } from '../lib/geocoding';

export interface Suggestion extends ResolvedPlace {
  icon: string;
}

// Shown when search box is empty
export const FEATURED: Suggestion[] = [
  { icon: '📍', name: 'Robson St & Burrard',  sub: 'Downtown',       lat: 49.2842, lng: -123.1208 },
  { icon: '📍', name: 'Davie St & Granville', sub: 'West End',       lat: 49.2756, lng: -123.1380 },
  { icon: '📍', name: 'Gastown',              sub: 'Water St',       lat: 49.2845, lng: -123.1082 },
  { icon: '📍', name: 'Granville Island',      sub: 'False Creek',    lat: 49.2710, lng: -123.1342 },
  { icon: '📍', name: 'Kitsilano Beach',       sub: 'Kitsilano',      lat: 49.2738, lng: -123.1545 },
  { icon: '📍', name: 'Main St & Broadway',    sub: 'Mount Pleasant', lat: 49.2632, lng: -123.1013 },
];

// Full searchable local dataset — searched before hitting Places API
export const SUGGESTIONS: Suggestion[] = [
  // Downtown core
  { icon: '📍', name: 'Robson St & Burrard',      sub: 'Downtown',        lat: 49.2842, lng: -123.1208 },
  { icon: '📍', name: 'Robson St & Granville',     sub: 'Downtown',        lat: 49.2833, lng: -123.1191 },
  { icon: '📍', name: 'Robson St & Thurlow',       sub: 'Downtown',        lat: 49.2845, lng: -123.1235 },
  { icon: '📍', name: 'Granville St & Georgia',    sub: 'Downtown',        lat: 49.2827, lng: -123.1186 },
  { icon: '📍', name: 'Granville St & Davie',      sub: 'Downtown South',  lat: 49.2757, lng: -123.1380 },
  { icon: '📍', name: 'Georgia St & Burrard',      sub: 'Downtown',        lat: 49.2851, lng: -123.1215 },
  { icon: '📍', name: 'Hastings St & Granville',   sub: 'Downtown',        lat: 49.2833, lng: -123.1134 },
  { icon: '📍', name: 'Dunsmuir St & Granville',   sub: 'Downtown',        lat: 49.2820, lng: -123.1178 },
  { icon: '📍', name: 'Pacific Centre',             sub: 'Downtown',        lat: 49.2826, lng: -123.1195 },
  { icon: '📍', name: 'Vancouver Art Gallery',      sub: 'Downtown',        lat: 49.2830, lng: -123.1205 },
  { icon: '📍', name: 'BC Place',                   sub: 'Downtown',        lat: 49.2779, lng: -123.1120 },
  { icon: '📍', name: 'Rogers Arena',               sub: 'Downtown',        lat: 49.2779, lng: -123.1089 },
  { icon: '📍', name: 'Canada Place',               sub: 'Waterfront',      lat: 49.2888, lng: -123.1115 },
  { icon: '📍', name: 'Vancouver Convention Centre',sub: 'Waterfront',      lat: 49.2886, lng: -123.1133 },
  { icon: '📍', name: 'Coal Harbour',               sub: 'Downtown',        lat: 49.2895, lng: -123.1260 },
  // Gastown & Chinatown
  { icon: '📍', name: 'Gastown',                    sub: 'Water St',        lat: 49.2845, lng: -123.1082 },
  { icon: '📍', name: 'Water St & Cambie',          sub: 'Gastown',         lat: 49.2841, lng: -123.1080 },
  { icon: '📍', name: 'Chinatown',                  sub: 'Pender St E',     lat: 49.2793, lng: -123.1012 },
  { icon: '📍', name: 'Main St & Pender',           sub: 'Chinatown',       lat: 49.2798, lng: -123.0994 },
  // Yaletown
  { icon: '📍', name: 'Yaletown',                   sub: 'Mainland St',     lat: 49.2736, lng: -123.1214 },
  { icon: '📍', name: 'Mainland St & Helmcken',     sub: 'Yaletown',        lat: 49.2736, lng: -123.1212 },
  { icon: '📍', name: 'Davie St & Hamilton',        sub: 'Yaletown',        lat: 49.2745, lng: -123.1209 },
  // West End
  { icon: '📍', name: 'Davie St & Granville',       sub: 'West End',        lat: 49.2756, lng: -123.1380 },
  { icon: '📍', name: 'Davie St & Denman',          sub: 'West End',        lat: 49.2829, lng: -123.1394 },
  { icon: '📍', name: 'Denman St & Robson',         sub: 'West End',        lat: 49.2869, lng: -123.1432 },
  { icon: '📍', name: 'English Bay',                sub: 'West End',        lat: 49.2849, lng: -123.1440 },
  { icon: '📍', name: 'Stanley Park Entrance',      sub: 'West End',        lat: 49.3000, lng: -123.1440 },
  // Kitsilano
  { icon: '📍', name: 'Kitsilano Beach',            sub: 'Kitsilano',       lat: 49.2738, lng: -123.1545 },
  { icon: '📍', name: 'W 4th Ave & Burrard',        sub: 'Kitsilano',       lat: 49.2698, lng: -123.1461 },
  { icon: '📍', name: 'W 4th Ave & Arbutus',        sub: 'Kitsilano',       lat: 49.2677, lng: -123.1555 },
  { icon: '📍', name: 'W Broadway & Macdonald',     sub: 'Kitsilano',       lat: 49.2634, lng: -123.1600 },
  // Fairview & South Granville
  { icon: '📍', name: 'Granville St & W Broadway',  sub: 'Fairview',        lat: 49.2634, lng: -123.1380 },
  { icon: '📍', name: 'South Granville',            sub: 'W 10th Ave',      lat: 49.2565, lng: -123.1394 },
  { icon: '📍', name: 'Cambie St & W Broadway',     sub: 'Fairview',        lat: 49.2632, lng: -123.1163 },
  // Mount Pleasant & Commercial Drive
  { icon: '📍', name: 'Main St & Broadway',         sub: 'Mount Pleasant',  lat: 49.2632, lng: -123.1013 },
  { icon: '📍', name: 'Commercial Drive & Broadway',sub: 'Commercial Drive', lat: 49.2632, lng: -123.0690 },
  { icon: '📍', name: 'Commercial Drive & Venables',sub: 'Commercial Drive', lat: 49.2728, lng: -123.0693 },
  { icon: '📍', name: 'Commercial Drive & E 1st',   sub: 'Commercial Drive', lat: 49.2678, lng: -123.0693 },
  // Cambie Corridor
  { icon: '📍', name: 'Cambie St & King Edward',    sub: 'Cambie',          lat: 49.2498, lng: -123.1164 },
  { icon: '📍', name: 'Oakridge Centre',            sub: 'Cambie',          lat: 49.2325, lng: -123.1165 },
  // Mount Pleasant & Brewery District
  { icon: '🍺', name: 'Brewery District',            sub: 'Mount Pleasant',  lat: 49.2680, lng: -123.0990 },
  { icon: '📍', name: 'E Broadway & Ontario',        sub: 'Mount Pleasant',  lat: 49.2632, lng: -123.0960 },
  { icon: '📍', name: 'E Broadway & Scotia',         sub: 'Mount Pleasant',  lat: 49.2632, lng: -123.0920 },
  // East Vancouver
  { icon: '📍', name: 'Hastings St & Commercial',   sub: 'East Vancouver',  lat: 49.2797, lng: -123.0690 },
  { icon: '📍', name: 'Kingsway & Broadway',        sub: 'East Vancouver',  lat: 49.2562, lng: -123.0780 },
  { icon: '📍', name: 'Fraser St & Kingsway',       sub: 'East Vancouver',  lat: 49.2492, lng: -123.0903 },
  // Granville Island
  { icon: '📍', name: 'Granville Island',           sub: 'False Creek',     lat: 49.2710, lng: -123.1342 },
  { icon: '📍', name: 'Granville Island Market',    sub: 'Granville Island', lat: 49.2714, lng: -123.1342 },
  // UBC & Point Grey
  { icon: '📍', name: 'UBC Campus',                 sub: 'Point Grey',      lat: 49.2606, lng: -123.2460 },
  { icon: '📍', name: 'UBC Hospital',               sub: 'Point Grey',      lat: 49.2576, lng: -123.2325 },
  { icon: '📍', name: 'W Broadway & Alma',          sub: 'Point Grey',      lat: 49.2633, lng: -123.1772 },
  // Kerrisdale & Marpole
  { icon: '📍', name: 'Kerrisdale',                 sub: 'W 41st Ave',      lat: 49.2327, lng: -123.1549 },
  { icon: '📍', name: 'Marpole',                    sub: 'Granville & 70th', lat: 49.2095, lng: -123.1370 },
  // SkyTrain stations
  { icon: '🚇', name: 'Waterfront Station',         sub: 'SkyTrain',        lat: 49.2863, lng: -123.1122 },
  { icon: '🚇', name: 'Stadium-Chinatown Station',  sub: 'SkyTrain',        lat: 49.2780, lng: -123.1094 },
  { icon: '🚇', name: 'Broadway-City Hall Station', sub: 'SkyTrain',        lat: 49.2632, lng: -123.1140 },
  { icon: '🚇', name: 'Commercial-Broadway Station',sub: 'SkyTrain',        lat: 49.2632, lng: -123.0690 },
  { icon: '🚇', name: 'Main Street-Science World',  sub: 'SkyTrain',        lat: 49.2731, lng: -123.1001 },
  // Hospitals & landmarks
  { icon: '🏥', name: 'Vancouver General Hospital', sub: 'Fairview',        lat: 49.2619, lng: -123.1235 },
  { icon: '🏥', name: 'St. Paul\'s Hospital',       sub: 'West End',        lat: 49.2821, lng: -123.1291 },
  { icon: '🏥', name: 'BC Children\'s Hospital',    sub: 'Oakridge',        lat: 49.2426, lng: -123.1245 },
  { icon: '🏟️', name: 'Science World',              sub: 'False Creek',     lat: 49.2734, lng: -123.1032 },
];
