export type ThemeColor =
  | 'pastelRose'
  | 'pastelLavender'
  | 'pastelMint'
  | 'pastelPeach'
  | 'pastelSky'
  | 'pastelButter'
  | 'pastelMatcha'
  // Legacy aliases
  | 'rose'
  | 'googleBlue'
  | 'lavender'
  | 'mint'
  | 'peach';

export interface ThemeSettings {
  darkMode: boolean;
  colorTheme: ThemeColor;
  customBgColor?: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  darkMode: false,
  colorTheme: 'pastelRose',
};

export interface ThemeConfig {
  name: string;
  shortName: string;
  bgLight: string;
  cardLight: string;
  borderLight: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  textDark: string;
  accentBadge: string;
  previewHex: string;
  pastelPill: string;
}

export const THEME_CONFIGS: Record<ThemeColor, ThemeConfig> = {
  pastelRose: {
    name: 'Rosa Pastel (Blush)',
    shortName: 'Rosa',
    bgLight: 'bg-[#FFF6F7]',
    cardLight: 'bg-white',
    borderLight: 'border-rose-100/90',
    primary: 'bg-[#F472B6] text-white hover:bg-[#EC4899]',
    primaryHover: 'hover:bg-[#EC4899]',
    primaryLight: 'bg-rose-50 text-rose-700 border-rose-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    previewHex: '#F472B6',
    pastelPill: '#FFE4E6',
  },
  pastelLavender: {
    name: 'Lavanda Pastel (Lilás)',
    shortName: 'Lavanda',
    bgLight: 'bg-[#FAF7FE]',
    cardLight: 'bg-white',
    borderLight: 'border-purple-100/90',
    primary: 'bg-[#C084FC] text-white hover:bg-[#A855F7]',
    primaryHover: 'hover:bg-[#A855F7]',
    primaryLight: 'bg-purple-50 text-purple-700 border-purple-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-purple-50 text-purple-700 border border-purple-200/70',
    previewHex: '#C084FC',
    pastelPill: '#F3E8FF',
  },
  pastelMint: {
    name: 'Menta Pastel (Sálvia)',
    shortName: 'Menta',
    bgLight: 'bg-[#F2FAF6]',
    cardLight: 'bg-white',
    borderLight: 'border-emerald-100/90',
    primary: 'bg-[#34D399] text-white hover:bg-[#10B981]',
    primaryHover: 'hover:bg-[#10B981]',
    primaryLight: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    previewHex: '#34D399',
    pastelPill: '#DCFCE7',
  },
  pastelPeach: {
    name: 'Pêssego Pastel (Damasco)',
    shortName: 'Pêssego',
    bgLight: 'bg-[#FFF8F3]',
    cardLight: 'bg-white',
    borderLight: 'border-orange-100/90',
    primary: 'bg-[#FB923C] text-white hover:bg-[#F97316]',
    primaryHover: 'hover:bg-[#F97316]',
    primaryLight: 'bg-orange-50 text-orange-800 border-orange-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-orange-50 text-orange-800 border border-orange-200/70',
    previewHex: '#FB923C',
    pastelPill: '#FFEDD5',
  },
  pastelSky: {
    name: 'Azul Céu Pastel (Bebê)',
    shortName: 'Azul Céu',
    bgLight: 'bg-[#F3F9FE]',
    cardLight: 'bg-white',
    borderLight: 'border-sky-100/90',
    primary: 'bg-[#38BDF8] text-white hover:bg-[#0EA5E9]',
    primaryHover: 'hover:bg-[#0EA5E9]',
    primaryLight: 'bg-sky-50 text-sky-700 border-sky-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-sky-50 text-sky-700 border border-sky-200/70',
    previewHex: '#38BDF8',
    pastelPill: '#E0F2FE',
  },
  pastelButter: {
    name: 'Baunilha Pastel (Manteiga)',
    shortName: 'Baunilha',
    bgLight: 'bg-[#FFFEF4]',
    cardLight: 'bg-white',
    borderLight: 'border-amber-100/90',
    primary: 'bg-[#FACC15] text-slate-900 hover:bg-[#EAB308]',
    primaryHover: 'hover:bg-[#EAB308]',
    primaryLight: 'bg-amber-50 text-amber-900 border-amber-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-amber-50 text-amber-900 border border-amber-200/70',
    previewHex: '#FACC15',
    pastelPill: '#FEF9C3',
  },
  pastelMatcha: {
    name: 'Matcha Pastel (Pistache)',
    shortName: 'Matcha',
    bgLight: 'bg-[#F7FCF2]',
    cardLight: 'bg-white',
    borderLight: 'border-lime-100/90',
    primary: 'bg-[#A3E635] text-slate-900 hover:bg-[#84CC16]',
    primaryHover: 'hover:bg-[#84CC16]',
    primaryLight: 'bg-lime-50 text-lime-800 border-lime-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-lime-50 text-lime-800 border border-lime-200/70',
    previewHex: '#A3E635',
    pastelPill: '#ECFCCB',
  },

  // Legacy mappings for backwards compatibility
  rose: {
    name: 'Rosa Pastel (Blush)',
    shortName: 'Rosa',
    bgLight: 'bg-[#FFF6F7]',
    cardLight: 'bg-white',
    borderLight: 'border-rose-100/90',
    primary: 'bg-[#F472B6] text-white hover:bg-[#EC4899]',
    primaryHover: 'hover:bg-[#EC4899]',
    primaryLight: 'bg-rose-50 text-rose-700 border-rose-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    previewHex: '#F472B6',
    pastelPill: '#FFE4E6',
  },
  googleBlue: {
    name: 'Azul Céu Pastel (Bebê)',
    shortName: 'Azul Céu',
    bgLight: 'bg-[#F3F9FE]',
    cardLight: 'bg-white',
    borderLight: 'border-sky-100/90',
    primary: 'bg-[#38BDF8] text-white hover:bg-[#0EA5E9]',
    primaryHover: 'hover:bg-[#0EA5E9]',
    primaryLight: 'bg-sky-50 text-sky-700 border-sky-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-sky-50 text-sky-700 border border-sky-200/70',
    previewHex: '#38BDF8',
    pastelPill: '#E0F2FE',
  },
  lavender: {
    name: 'Lavanda Pastel (Lilás)',
    shortName: 'Lavanda',
    bgLight: 'bg-[#FAF7FE]',
    cardLight: 'bg-white',
    borderLight: 'border-purple-100/90',
    primary: 'bg-[#C084FC] text-white hover:bg-[#A855F7]',
    primaryHover: 'hover:bg-[#A855F7]',
    primaryLight: 'bg-purple-50 text-purple-700 border-purple-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-purple-50 text-purple-700 border border-purple-200/70',
    previewHex: '#C084FC',
    pastelPill: '#F3E8FF',
  },
  mint: {
    name: 'Menta Pastel (Sálvia)',
    shortName: 'Menta',
    bgLight: 'bg-[#F2FAF6]',
    cardLight: 'bg-white',
    borderLight: 'border-emerald-100/90',
    primary: 'bg-[#34D399] text-white hover:bg-[#10B981]',
    primaryHover: 'hover:bg-[#10B981]',
    primaryLight: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    previewHex: '#34D399',
    pastelPill: '#DCFCE7',
  },
  peach: {
    name: 'Pêssego Pastel (Damasco)',
    shortName: 'Pêssego',
    bgLight: 'bg-[#FFF8F3]',
    cardLight: 'bg-white',
    borderLight: 'border-orange-100/90',
    primary: 'bg-[#FB923C] text-white hover:bg-[#F97316]',
    primaryHover: 'hover:bg-[#F97316]',
    primaryLight: 'bg-orange-50 text-orange-800 border-orange-200/70',
    textDark: 'text-slate-800',
    accentBadge: 'bg-orange-50 text-orange-800 border border-orange-200/70',
    previewHex: '#FB923C',
    pastelPill: '#FFEDD5',
  },
};

// Pastel Color presets for categories & general UI
export const PASTEL_PRESETS = [
  { name: 'Rosa Bebê', color: '#FDA4AF', hex: '#FDA4AF', lightBg: '#FFF1F2' },
  { name: 'Pêssego Suave', color: '#FED7AA', hex: '#FED7AA', lightBg: '#FFF7ED' },
  { name: 'Baunilha Doce', color: '#FEF08A', hex: '#FEF08A', lightBg: '#FEFCE8' },
  { name: 'Sálvia / Menta', color: '#A7F3D0', hex: '#A7F3D0', lightBg: '#F0FDF4' },
  { name: 'Turquesa Pastel', color: '#99F6E4', hex: '#99F6E4', lightBg: '#F0FDFA' },
  { name: 'Azul Nuvem', color: '#BAE6FD', hex: '#BAE6FD', lightBg: '#F0F9FF' },
  { name: 'Lavanda Suave', color: '#D8B4FE', hex: '#D8B4FE', lightBg: '#FAF5FF' },
  { name: 'Lilás Macio', color: '#FBCFE8', hex: '#FBCFE8', lightBg: '#FDF2F8' },
  { name: 'Matcha Fresco', color: '#D9F99D', hex: '#D9F99D', lightBg: '#F7FEE7' },
  { name: 'Damasco Soft', color: '#FDBA74', hex: '#FDBA74', lightBg: '#FFF7ED' },
  { name: 'Coral Claro', color: '#FCA5A5', hex: '#FCA5A5', lightBg: '#FEF2F2' },
  { name: 'Areia / Cinza Soft', color: '#CBD5E1', hex: '#CBD5E1', lightBg: '#F8FAFC' },
];

export const PASTEL_PALETTE_PRESETS = PASTEL_PRESETS;

