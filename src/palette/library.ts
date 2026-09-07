import type { FreeColors } from '../main/data';
import type { ThemeMode } from './presets';
export interface PaletteLibraryItem {
  key: string;
  nameKey: string;
  colors: Required<FreeColors>;
}
export const paletteLibrary: Record<ThemeMode, PaletteLibraryItem[]> = {
  light: [
    {
      key: 'obsidian-light',
      nameKey: 'freeLibraryObsidianLight',
      colors: { base: '#8a5cf5', primary: '#7852ee', accent: '#8a5cf5', background: '#ffffff', surface: '#f6f6f6', onbackground: '#222222' },
    },
    {
      key: 'minimal-light',
      nameKey: 'freeLibraryMinimalLight',
      colors: { base: '#6a8695', primary: '#59717d', accent: '#6a8695', background: '#ffffff', surface: '#f5f5f5', onbackground: '#0f0f0f' },
    },
    {
      key: 'things-light',
      nameKey: 'freeLibraryThingsLight',
      colors: { base: '#2e80f2', primary: '#2070df', accent: '#2e80f2', background: '#ffffff', surface: '#f6f7f8', onbackground: '#222222' },
    },
    {
      key: 'atom-light',
      nameKey: 'freeLibraryAtomLight',
      colors: { base: '#4078f2', primary: '#2d6af1', accent: '#a626a4', background: '#fafafa', surface: '#f0f0f0', onbackground: '#383a42' },
    },
    {
      key: 'solarized-light',
      nameKey: 'freeLibrarySolarizedLight',
      colors: { base: '#268bd2', primary: '#2076b3', accent: '#2aa198', background: '#fdf6e3', surface: '#eee8d5', onbackground: '#657b83' },
    },
    {
      key: 'catppuccin-latte',
      nameKey: 'freeLibraryCatppuccinLatte',
      colors: { base: '#8839ef', primary: '#8839ef', accent: '#1e66f5', background: '#eff1f5', surface: '#ccd0da', onbackground: '#4c4f69' },
    },
    {
      key: 'gruvbox-light',
      nameKey: 'freeLibraryGruvboxLight',
      colors: { base: '#d79921', primary: '#076678', accent: '#af3a03', background: '#fbf1c7', surface: '#ebdbb2', onbackground: '#3c3836' },
    },
    {
      key: 'rose-pine-dawn',
      nameKey: 'freeLibraryRosePineDawn',
      colors: { base: '#907aa9', primary: '#286983', accent: '#b4637a', background: '#fffaf3', surface: '#faf4ed', onbackground: '#575279' },
    },
    {
      key: 'tokyo-night-day',
      nameKey: 'freeLibraryTokyoNightDay',
      colors: { base: '#2e7de9', primary: '#3760bf', accent: '#7847bd', background: '#e1e2e7', surface: '#c4c8da', onbackground: '#3760bf' },
    },
    {
      key: 'everforest-light-hard',
      nameKey: 'freeLibraryEverforestLightHard',
      colors: { base: '#8da101', primary: '#5c6a72', accent: '#35a77c', background: '#fffbef', surface: '#f8f5e4', onbackground: '#5c6a72' },
    },
    {
      key: 'everforest-light',
      nameKey: 'freeLibraryEverforestLight',
      colors: { base: '#8da101', primary: '#5c6a72', accent: '#35a77c', background: '#fdf6e3', surface: '#f4f0d9', onbackground: '#5c6a72' },
    },
    {
      key: 'everforest-light-soft',
      nameKey: 'freeLibraryEverforestLightSoft',
      colors: { base: '#8da101', primary: '#5c6a72', accent: '#35a77c', background: '#f3ead3', surface: '#eae4ca', onbackground: '#5c6a72' },
    },
    {
      key: 'ayu-light',
      nameKey: 'freeLibraryAyuLight',
      colors: { base: '#f29718', primary: '#ad6000', accent: '#f29718', background: '#fcfcfc', surface: '#f8f9fa', onbackground: '#5c6166' },
    },
    {
      key: 'cupertino-light',
      nameKey: 'freeLibraryCupertinoLight',
      colors: { base: '#0088ff', primary: '#0076de', accent: '#ff2d55', background: '#ffffff', surface: '#f2f2f2', onbackground: '#262626' },
    },
    {
      key: 'dracula-alucard',
      nameKey: 'freeLibraryDraculaAlucard',
      colors: { base: '#644ac9', primary: '#644ac9', accent: '#a3144d', background: '#fffbeb', surface: '#efeddc', onbackground: '#1f1f1f' },
    },
    {
      key: 'flexoki-light',
      nameKey: 'freeLibraryFlexokiLight',
      colors: { base: '#205ea6', primary: '#205ea6', accent: '#a02f6f', background: '#fffcf0', surface: '#f2f0e5', onbackground: '#403e3c' },
    },
    {
      key: 'kanagawa-lotus',
      nameKey: 'freeLibraryKanagawaLotus',
      colors: { base: '#4d699b', primary: '#4d699b', accent: '#b35b79', background: '#f2ecbc', surface: '#e7dba0', onbackground: '#545464' },
    },
    {
      key: 'light-owl',
      nameKey: 'freeLibraryLightOwl',
      colors: { base: '#2aa298', primary: '#994cc3', accent: '#2aa298', background: '#fbfbfb', surface: '#f0f0f0', onbackground: '#403f53' },
    },
    {
      key: 'tomorrow-light',
      nameKey: 'freeLibraryTomorrowLight',
      colors: { base: '#4271ae', primary: '#4271ae', accent: '#8959a8', background: '#ffffff', surface: '#efefef', onbackground: '#4d4d4c' },
    },
    {
      key: 'github-light-default',
      nameKey: 'freeLibraryGitHubLightDefault',
      colors: { base: '#0969da', primary: '#0969da', accent: '#8250df', background: '#ffffff', surface: '#f6f8fa', onbackground: '#24292f' },
    },
    {
      key: 'github-light-high-contrast',
      nameKey: 'freeLibraryGitHubLightHighContrast',
      colors: { base: '#0349b4', primary: '#0349b4', accent: '#622cbc', background: '#ffffff', surface: '#e7ecf0', onbackground: '#0e1116' },
    },
    {
      key: 'github-light-colorblind',
      nameKey: 'freeLibraryGitHubLightColorblind',
      colors: { base: '#0969da', primary: '#0969da', accent: '#bc4c00', background: '#ffffff', surface: '#f6f8fa', onbackground: '#24292f' },
    },
    {
      key: 'github-light-legacy',
      nameKey: 'freeLibraryGitHubLightLegacy',
      colors: { base: '#0366d6', primary: '#0366d6', accent: '#6f42c1', background: '#ffffff', surface: '#f6f8fa', onbackground: '#24292e' },
    },
    {
      key: 'material-lighter',
      nameKey: 'freeLibraryMaterialLighter',
      colors: { base: '#39adb5', primary: '#546e7a', accent: '#7c4dff', background: '#fafafa', surface: '#eeeeee', onbackground: '#546e7a' },
    },
    {
      key: 'papercolor-light',
      nameKey: 'freeLibraryPaperColorLight',
      colors: { base: '#005f87', primary: '#005f87', accent: '#af0000', background: '#eeeeee', surface: '#e4e4e4', onbackground: '#444444' },
    },
    {
      key: 'base16-default-light',
      nameKey: 'freeLibraryBase16DefaultLight',
      colors: { base: '#7cafc2', primary: '#ab4642', accent: '#ba8baf', background: '#f8f8f8', surface: '#e8e8e8', onbackground: '#383838' },
    },
    {
      key: 'blue-topaz-light',
      nameKey: 'freeLibraryBlueTopazLight',
      colors: { base: '#2f93e4', primary: '#0072d0', accent: '#c74df7', background: '#ffffff', surface: '#f3f3f3', onbackground: '#0e0e0e' },
    },
    {
      key: 'its-light',
      nameKey: 'freeLibraryITSLight',
      colors: { base: '#912e2e', primary: '#912e2e', accent: '#5599d0', background: '#f8fbff', surface: '#eef3fd', onbackground: '#30353a' },
    },
    {
      key: 'border-light',
      nameKey: 'freeLibraryBorderLight',
      colors: { base: '#4b63fb', primary: '#1775d9', accent: '#8f47e1', background: '#ffffff', surface: '#f0f0f0', onbackground: '#1d1d20' },
    },
    {
      key: 'iceberg-light',
      nameKey: 'freeLibraryIcebergLight',
      colors: { base: '#2e539e', primary: '#2e539e', accent: '#cd517a', background: '#e9e9ed', surface: '#dddfe9', onbackground: '#33374c' },
    },
    {
      key: 'horizon-bright',
      nameKey: 'freeLibraryHorizonBright',
      colors: { base: '#e84a72', primary: '#da103f', accent: '#8931b9', background: '#fdf0ed', surface: '#fadad1', onbackground: '#16161c' },
    },
    {
      key: 'dayfox',
      nameKey: 'freeLibraryDayfox',
      colors: { base: '#2848a9', primary: '#2848a9', accent: '#6e33ce', background: '#f6f2ee', surface: '#e4dcd4', onbackground: '#3d2b5a' },
    },
    {
      key: 'dawnfox',
      nameKey: 'freeLibraryDawnfox',
      colors: { base: '#907aa9', primary: '#286983', accent: '#b4637a', background: '#faf4ed', surface: '#ebe5df', onbackground: '#575279' },
    },
    {
      key: 'oxocarbon-light',
      nameKey: 'freeLibraryOxocarbonLight',
      colors: { base: '#0f62fe', primary: '#0f62fe', accent: '#673ab7', background: '#ffffff', surface: '#f2f2f2', onbackground: '#37474f' },
    },
    {
      key: 'hybrid-light',
      nameKey: 'freeLibraryHybridLight',
      colors: { base: '#00005f', primary: '#00005f', accent: '#5f005f', background: '#e4e4e4', surface: '#d0d0d0', onbackground: '#000000' },
    },
    {
      key: 'hemisu-light',
      nameKey: 'freeLibraryHemisuLight',
      colors: { base: '#538192', primary: '#005f87', accent: '#ff0055', background: '#ffffff', surface: '#eeeeee', onbackground: '#111111' },
    },
    {
      key: 'edge-light',
      nameKey: 'freeLibraryEdgeLight',
      colors: { base: '#5079be', primary: '#4973bb', accent: '#b05ccc', background: '#fafafa', surface: '#eef1f4', onbackground: '#4b505b' },
    },
    {
      key: 'gruvbox-material-light-hard-material',
      nameKey: 'freeLibraryGruvboxMaterialLightHardMaterial',
      colors: { base: '#45707a', primary: '#45707a', accent: '#945e80', background: '#f9f5d7', surface: '#f5edca', onbackground: '#654735' },
    },
    {
      key: 'gruvbox-material-light-hard-mix',
      nameKey: 'freeLibraryGruvboxMaterialLightHardMix',
      colors: { base: '#266b79', primary: '#266b79', accent: '#924f79', background: '#f9f5d7', surface: '#f5edca', onbackground: '#514036' },
    },
    {
      key: 'gruvbox-material-light-hard-original',
      nameKey: 'freeLibraryGruvboxMaterialLightHardOriginal',
      colors: { base: '#076678', primary: '#076678', accent: '#8f3f71', background: '#f9f5d7', surface: '#f5edca', onbackground: '#3c3836' },
    },
    {
      key: 'gruvbox-material-light-medium-material',
      nameKey: 'freeLibraryGruvboxMaterialLightMediumMaterial',
      colors: { base: '#45707a', primary: '#45707a', accent: '#945e80', background: '#fbf1c7', surface: '#f4e8be', onbackground: '#654735' },
    },
    {
      key: 'gruvbox-material-light-medium-mix',
      nameKey: 'freeLibraryGruvboxMaterialLightMediumMix',
      colors: { base: '#266b79', primary: '#266b79', accent: '#924f79', background: '#fbf1c7', surface: '#f4e8be', onbackground: '#514036' },
    },
    {
      key: 'gruvbox-material-light-medium-original',
      nameKey: 'freeLibraryGruvboxMaterialLightMediumOriginal',
      colors: { base: '#076678', primary: '#076678', accent: '#8f3f71', background: '#fbf1c7', surface: '#f4e8be', onbackground: '#3c3836' },
    },
    {
      key: 'gruvbox-material-light-soft-material',
      nameKey: 'freeLibraryGruvboxMaterialLightSoftMaterial',
      colors: { base: '#45707a', primary: '#436d77', accent: '#945e80', background: '#f2e5bc', surface: '#eddeb5', onbackground: '#654735' },
    },
    {
      key: 'gruvbox-material-light-soft-mix',
      nameKey: 'freeLibraryGruvboxMaterialLightSoftMix',
      colors: { base: '#266b79', primary: '#266b79', accent: '#924f79', background: '#f2e5bc', surface: '#eddeb5', onbackground: '#514036' },
    },
    {
      key: 'gruvbox-material-light-soft-original',
      nameKey: 'freeLibraryGruvboxMaterialLightSoftOriginal',
      colors: { base: '#076678', primary: '#076678', accent: '#8f3f71', background: '#f2e5bc', surface: '#eddeb5', onbackground: '#3c3836' },
    },
    {
      key: 'primary-light',
      nameKey: 'freeLibraryPrimaryLight',
      colors: { base: '#22729b', primary: '#22729b', accent: '#df453a', background: '#f8f5f1', surface: '#eee7dd', onbackground: '#432e14' },
    },
    {
      key: 'sanctum-light',
      nameKey: 'freeLibrarySanctumLight',
      colors: { base: '#f68d45', primary: '#bb4c2e', accent: '#f68d45', background: '#f4f4f0', surface: '#e2e0dc', onbackground: '#161616' },
    },
    {
      key: 'sanctum-white',
      nameKey: 'freeLibrarySanctumWhite',
      colors: { base: '#f68d45', primary: '#bb4c2e', accent: '#f68d45', background: '#fdfefe', surface: '#f4f4f0', onbackground: '#161616' },
    },
    {
      key: 'cyber-glow-light',
      nameKey: 'freeLibraryCyberGlowLight',
      colors: { base: '#00cccc', primary: '#3a738d', accent: '#cc00cc', background: '#f5f5f5', surface: '#ececec', onbackground: '#1a1a2e' },
    },
    {
      key: 'prism-swan',
      nameKey: 'freeLibraryPrismSwan',
      colors: { base: '#845ae7', primary: '#845ae7', accent: '#cc3399', background: '#ffffff', surface: '#ededed', onbackground: '#262626' },
    },
    {
      key: 'prism-latte',
      nameKey: 'freeLibraryPrismLatte',
      colors: { base: '#8460e2', primary: '#7f59e0', accent: '#c93b97', background: '#fcfaf8', surface: '#f0e5db', onbackground: '#362516' },
    },
    {
      key: 'prism-periwinkle',
      nameKey: 'freeLibraryPrismPeriwinkle',
      colors: { base: '#8d62f8', primary: '#7f4ff8', accent: '#d83ba1', background: '#f7f9fd', surface: '#dfe6f6', onbackground: '#111f3b' },
    },
    {
      key: 'prism-pistachio',
      nameKey: 'freeLibraryPrismPistachio',
      colors: { base: '#885aed', primary: '#8555ec', accent: '#d22d9e', background: '#fcfdfc', surface: '#e5f0e0', onbackground: '#213419' },
    },
    {
      key: 'prism-peach',
      nameKey: 'freeLibraryPrismPeach',
      colors: { base: '#8859ee', primary: '#8251ed', accent: '#cf2a9b', background: '#fdf7f7', surface: '#f7e4e3', onbackground: '#3b1311' },
    },
    {
      key: 'flomo-light',
      nameKey: 'freeLibraryFlomoLight',
      colors: { base: '#30cf79', primary: '#147a46', accent: '#30cf79', background: '#ffffff', surface: '#f3f6f4', onbackground: '#2f3331' },
    },
    {
      key: 'notion-light',
      nameKey: 'freeLibraryNotionLight',
      colors: { base: '#0075de', primary: '#0075de', accent: '#f64932', background: '#ffffff', surface: '#f6f5f4', onbackground: '#0d0d0d' },
    },
    {
      key: 'wolai-light',
      nameKey: 'freeLibraryWolaiLight',
      colors: { base: '#cf5659', primary: '#b84c4e', accent: '#cf5659', background: '#ffffff', surface: '#f3f3f3', onbackground: '#262626' },
    },
    {
      key: 'rednote-light',
      nameKey: 'freeLibraryRedNoteLight',
      colors: { base: '#ff2442', primary: '#c41430', accent: '#ff2442', background: '#ffffff', surface: '#f5f5f5', onbackground: '#333333' },
    },
    {
      key: 'linear-light',
      nameKey: 'freeLibraryLinearLight',
      colors: { base: '#5e6ad2', primary: '#5661c9', accent: '#7170ff', background: '#f7f8f8', surface: '#f3f4f5', onbackground: '#28282c' },
    },
    {
      key: 'figma-light',
      nameKey: 'freeLibraryFigmaLight',
      colors: { base: '#0d99ff', primary: '#0070d1', accent: '#f24822', background: '#ffffff', surface: '#f5f5f5', onbackground: '#1a1a1a' },
    },
    {
      key: 'bear-red-graphite',
      nameKey: 'freeLibraryBearRedGraphite',
      colors: { base: '#d14c3e', primary: '#b44b41', accent: '#d14c3e', background: '#ffffff', surface: '#f7f7f7', onbackground: '#333333' },
    },
    {
      key: 'craft-light',
      nameKey: 'freeLibraryCraftLight',
      colors: { base: '#5b5bd6', primary: '#514dbb', accent: '#e05a47', background: '#ffffff', surface: '#f3f2f0', onbackground: '#252525' },
    },
    {
      key: 'yuque-light',
      nameKey: 'freeLibraryYuQueLight',
      colors: { base: '#25b864', primary: '#167a47', accent: '#25b864', background: '#ffffff', surface: '#f6f8fa', onbackground: '#262626' },
    },
    {
      key: 'feishu-light',
      nameKey: 'freeLibraryFeiShuLight',
      colors: { base: '#1456f0', primary: '#1456f0', accent: '#00b8d9', background: '#ffffff', surface: '#f5f6f7', onbackground: '#1f2329' },
    },
    {
      key: 'apple-notes-light',
      nameKey: 'freeLibraryAppleNotesLight',
      colors: { base: '#ffcc00', primary: '#8a6700', accent: '#ffcc00', background: '#ffffff', surface: '#f2f2f7', onbackground: '#1c1c1e' },
    },
    {
      key: 'heptabase-light',
      nameKey: 'freeLibraryHeptabaseLight',
      colors: { base: '#6c5ce7', primary: '#5747c7', accent: '#ff7a59', background: '#ffffff', surface: '#f4f5f7', onbackground: '#252525' },
    },
    {
      key: 'capacities-light',
      nameKey: 'freeLibraryCapacitiesLight',
      colors: { base: '#6c63ff', primary: '#554bd8', accent: '#d96c4f', background: '#fffdf8', surface: '#f3f0e9', onbackground: '#2d2b29' },
    },
    {
      key: 'anytype-light',
      nameKey: 'freeLibraryAnytypeLight',
      colors: { base: '#ffb522', primary: '#3e58eb', accent: '#ffb522', background: '#ffffff', surface: '#f2f2f2', onbackground: '#252525' },
    },
    {
      key: 'arc-light',
      nameKey: 'freeLibraryArcLight',
      colors: { base: '#7c5cff', primary: '#6548d8', accent: '#ff5c8a', background: '#ffffff', surface: '#f2edf7', onbackground: '#252129' },
    },
    {
      key: 'vercel-light',
      nameKey: 'freeLibraryVercelLight',
      colors: { base: '#000000', primary: '#0070f3', accent: '#0070f3', background: '#ffffff', surface: '#fafafa', onbackground: '#111111' },
    },
    {
      key: 'slack-light',
      nameKey: 'freeLibrarySlackLight',
      colors: { base: '#4a154b', primary: '#1264a3', accent: '#e01e5a', background: '#ffffff', surface: '#f8f8f8', onbackground: '#1d1c1d' },
    },
    {
      key: 'anuppuccin-material-mint-light',
      nameKey: 'freeLibraryAnuPpuccinMaterialMintLight',
      colors: { base: '#009688', primary: '#00796b', accent: '#26a69a', background: '#fafafa', surface: '#e0f2f1', onbackground: '#37474f' },
    },
    {
      key: 'anuppuccin-luminescence-light',
      nameKey: 'freeLibraryAnuPpuccinLuminescenceLight',
      colors: { base: '#526d82', primary: '#526d82', accent: '#c07a5b', background: '#fffdf7', surface: '#f2eee3', onbackground: '#3c4248' },
    },
    {
      key: 'anuppuccin-sandy-beaches-light',
      nameKey: 'freeLibraryAnuPpuccinSandyBeachesLight',
      colors: { base: '#b57614', primary: '#665c54', accent: '#d65d0e', background: '#fff9e8', surface: '#f3e7c9', onbackground: '#51483f' },
    },
    {
      key: 'border-eye-friendly',
      nameKey: 'freeLibraryBorderEyeFriendly',
      colors: { base: '#6c7a45', primary: '#59633e', accent: '#a56b46', background: '#f7f3e8', surface: '#ebe5d7', onbackground: '#45423b' },
    },
    {
      key: 'border-fresh',
      nameKey: 'freeLibraryBorderFresh',
      colors: { base: '#92bd4c', primary: '#607d2f', accent: '#92bd4c', background: '#ffffff', surface: '#ecedd5', onbackground: '#30352c' },
    },
    {
      key: 'border-mint',
      nameKey: 'freeLibraryBorderMint',
      colors: { base: '#4fae7a', primary: '#347a55', accent: '#56c596', background: '#fbfffd', surface: '#e6f5ee', onbackground: '#284138' },
    },
    {
      key: 'border-paper-like',
      nameKey: 'freeLibraryBorderPaperLike',
      colors: { base: '#a46a3f', primary: '#7a4e30', accent: '#b78155', background: '#fbf6ea', surface: '#e9dfcc', onbackground: '#4a4238' },
    },
    {
      key: 'border-boundary',
      nameKey: 'freeLibraryBorderBoundary',
      colors: { base: '#4b63fb', primary: '#3e54d3', accent: '#8f47e1', background: '#ffffff', surface: '#ededed', onbackground: '#202124' },
    },
    {
      key: 'border-silver',
      nameKey: 'freeLibraryBorderSilver',
      colors: { base: '#7b8794', primary: '#59636e', accent: '#8b78a8', background: '#fafbfc', surface: '#e4e7ea', onbackground: '#34383d' },
    },
    {
      key: 'border-shore',
      nameKey: 'freeLibraryBorderShore',
      colors: { base: '#4285a4', primary: '#356b84', accent: '#69a6b8', background: '#fbfdff', surface: '#e5eef5', onbackground: '#34434c' },
    },
    {
      key: 'its-adventure-light',
      nameKey: 'freeLibraryITSAdventureLight',
      colors: { base: '#6eca85', primary: '#5d4738', accent: '#bf5e5e', background: '#6e5849', surface: '#503d35', onbackground: '#eeeae8' },
    },
    {
      key: 'its-drowned-light',
      nameKey: 'freeLibraryITSDrownedLight',
      colors: { base: '#43c1a5', primary: '#2e918a', accent: '#69cfd2', background: '#f8fbff', surface: '#eef3fd', onbackground: '#697580' },
    },
    {
      key: 'its-tangerine-dunes-light',
      nameKey: 'freeLibraryITSTangerineDunesLight',
      colors: { base: '#e19363', primary: '#91542e', accent: '#e57858', background: '#f8fbff', surface: '#eef3fd', onbackground: '#697580' },
    },
    {
      key: 'its-school-days-light',
      nameKey: 'freeLibraryITSSchoolDaysLight',
      colors: { base: '#4f81bd', primary: '#375b86', accent: '#c0504d', background: '#fffef8', surface: '#f1ecd9', onbackground: '#373737' },
    },
    {
      key: 'its-slrvb-blue-light',
      nameKey: 'freeLibraryITSSlRvbBlueLight',
      colors: { base: '#5599d0', primary: '#417ca8', accent: '#b06a83', background: '#f8fbff', surface: '#eef3fd', onbackground: '#4f5963' },
    },
    {
      key: 'its-slrvb-gray-light',
      nameKey: 'freeLibraryITSSlRvbGrayLight',
      colors: { base: '#777777', primary: '#555555', accent: '#a25f5f', background: '#fafafa', surface: '#eeeeee', onbackground: '#444444' },
    },
    {
      key: 'its-minimalist-light',
      nameKey: 'freeLibraryITSMinimalistLight',
      colors: { base: '#6b7c8f', primary: '#505c68', accent: '#96705b', background: '#ffffff', surface: '#f2f2f2', onbackground: '#343434' },
    },
    {
      key: 'its-dd-light',
      nameKey: 'freeLibraryITSDDLight',
      colors: { base: '#a11d22', primary: '#7b161a', accent: '#b68a3d', background: '#f7f0df', surface: '#e8ddc6', onbackground: '#3a3025' },
    },
    {
      key: 'its-vero-galaxy-light',
      nameKey: 'freeLibraryITSVeroGalaxyLight',
      colors: { base: '#6f56c9', primary: '#5943a4', accent: '#d0598e', background: '#fbf9ff', surface: '#ece7f7', onbackground: '#3d354c' },
    },
    {
      key: 'shimmering-focus-light',
      nameKey: 'freeLibraryShimmeringFocusLight',
      colors: { base: '#6b78d1', primary: '#515da9', accent: '#bc5c8d', background: '#ffffff', surface: '#f1f1f1', onbackground: '#333333' },
    },
    {
      key: 'shimmering-focus-gamma-light',
      nameKey: 'freeLibraryShimmeringFocusGammaLight',
      colors: { base: '#8f6cba', primary: '#715295', accent: '#c15f81', background: '#fbfafc', surface: '#ece8f0', onbackground: '#39343d' },
    },
    {
      key: 'shimmering-focus-coffee-light',
      nameKey: 'freeLibraryShimmeringFocusCoffeeLight',
      colors: { base: '#9a6540', primary: '#714b34', accent: '#b85b52', background: '#faf5ed', surface: '#ebe0d2', onbackground: '#493b32' },
    },
    {
      key: 'encore-sterling',
      nameKey: 'freeLibraryEncoreSterling',
      colors: { base: '#7c3aed', primary: '#6d28d9', accent: '#2563eb', background: '#ffffff', surface: '#f4f4f5', onbackground: '#27272a' },
    },
    {
      key: 'magicuser-default-light',
      nameKey: 'freeLibraryMagicUserDefaultLight',
      colors: { base: '#6758d9', primary: '#594bc0', accent: '#c34f89', background: '#ffffff', surface: '#f1f1f4', onbackground: '#33343a' },
    },
    {
      key: 'magicuser-room-lamp-light',
      nameKey: 'freeLibraryMagicUserRoomLampLight',
      colors: { base: '#bd7543', primary: '#985b35', accent: '#c85e4b', background: '#fffaf3', surface: '#f0e5d8', onbackground: '#4b3b30' },
    },
    {
      key: 'magicuser-purple-light',
      nameKey: 'freeLibraryMagicUserPurpleLight',
      colors: { base: '#7c5ce6', primary: '#6244bd', accent: '#b84fcb', background: '#fdfbff', surface: '#eee8f4', onbackground: '#3d3548' },
    },
    {
      key: 'magicuser-teal-light',
      nameKey: 'freeLibraryMagicUserTealLight',
      colors: { base: '#318b82', primary: '#276f68', accent: '#438ba7', background: '#fbfefd', surface: '#e4f1ee', onbackground: '#30413f' },
    },
    {
      key: 'magicuser-gray-light',
      nameKey: 'freeLibraryMagicUserGrayLight',
      colors: { base: '#6b7280', primary: '#555b65', accent: '#6366f1', background: '#ffffff', surface: '#eeeeef', onbackground: '#303236' },
    },
    {
      key: 'magicuser-camouflage-light',
      nameKey: 'freeLibraryMagicUserCamouflageLight',
      colors: { base: '#758247', primary: '#5b6538', accent: '#9a6c3e', background: '#fbfcf5', surface: '#e8eadb', onbackground: '#414437' },
    },
    {
      key: 'magicuser-moon-light',
      nameKey: 'freeLibraryMagicUserMoonLight',
      colors: { base: '#667cc7', primary: '#5367aa', accent: '#8a6ac2', background: '#fcfdff', surface: '#e9edf6', onbackground: '#3a4050' },
    },
    {
      key: 'magicuser-teacher-light',
      nameKey: 'freeLibraryMagicUserTeacherLight',
      colors: { base: '#507da8', primary: '#41688e', accent: '#a76d41', background: '#ffffff', surface: '#edf1f4', onbackground: '#36414a' },
    },
    {
      key: 'magicuser-creativity-light',
      nameKey: 'freeLibraryMagicUserCreativityLight',
      colors: { base: '#bd538f', primary: '#984371', accent: '#6977d3', background: '#fffafd', surface: '#f1e6ed', onbackground: '#493942' },
    },
    {
      key: 'magicuser-concentration-light',
      nameKey: 'freeLibraryMagicUserConcentrationLight',
      colors: { base: '#4285a4', primary: '#356b84', accent: '#4e967c', background: '#fbfdfe', surface: '#e7eff3', onbackground: '#34434b' },
    },
    {
      key: 'magicuser-stealth-light',
      nameKey: 'freeLibraryMagicUserStealthLight',
      colors: { base: '#666d76', primary: '#50565e', accent: '#77808b', background: '#fafafa', surface: '#e8e9ea', onbackground: '#34373b' },
    },
    {
      key: 'claude-light',
      nameKey: 'freeLibraryClaudeLight',
      colors: { base: '#d97757', primary: '#d97757', accent: '#6a9bcc', background: '#faf9f5', surface: '#edece8', onbackground: '#141413' },
    },
  ],
  dark: [
    {
      key: 'obsidian-dark',
      nameKey: 'freeLibraryObsidianDark',
      colors: { base: '#8a5cf5', primary: '#a882ff', accent: '#8a5cf5', background: '#1c1c1c', surface: '#282828', onbackground: '#dadada' },
    },
    {
      key: 'minimal-dark',
      nameKey: 'freeLibraryMinimalDark',
      colors: { base: '#889eaa', primary: '#889eaa', accent: '#889eaa', background: '#262626', surface: '#212121', onbackground: '#d1d1d1' },
    },
    {
      key: 'things-dark',
      nameKey: 'freeLibraryThingsDark',
      colors: { base: '#79a9ec', primary: '#79a9ec', accent: '#027aff', background: '#1c2127', surface: '#181c20', onbackground: '#dadada' },
    },
    {
      key: 'atom-dark',
      nameKey: 'freeLibraryAtomDark',
      colors: { base: '#61afef', primary: '#61afef', accent: '#c678dd', background: '#282c34', surface: '#21252b', onbackground: '#abb2bf' },
    },
    {
      key: 'solarized-dark',
      nameKey: 'freeLibrarySolarizedDark',
      colors: { base: '#2aa198', primary: '#2aa198', accent: '#268bd2', background: '#002b36', surface: '#073642', onbackground: '#839496' },
    },
    {
      key: 'catppuccin-frappe',
      nameKey: 'freeLibraryCatppuccinFrappe',
      colors: { base: '#ca9ee6', primary: '#8caaee', accent: '#ca9ee6', background: '#303446', surface: '#414559', onbackground: '#c6d0f5' },
    },
    {
      key: 'catppuccin-macchiato',
      nameKey: 'freeLibraryCatppuccinMacchiato',
      colors: { base: '#c6a0f6', primary: '#8aadf4', accent: '#c6a0f6', background: '#24273a', surface: '#363a4f', onbackground: '#cad3f5' },
    },
    {
      key: 'catppuccin-mocha',
      nameKey: 'freeLibraryCatppuccinMocha',
      colors: { base: '#cba6f7', primary: '#89b4fa', accent: '#cba6f7', background: '#1e1e2e', surface: '#313244', onbackground: '#cdd6f4' },
    },
    {
      key: 'gruvbox-dark',
      nameKey: 'freeLibraryGruvboxDark',
      colors: { base: '#fabd2f', primary: '#83a598', accent: '#fe8019', background: '#282828', surface: '#3c3836', onbackground: '#ebdbb2' },
    },
    {
      key: 'rose-pine',
      nameKey: 'freeLibraryRosePine',
      colors: { base: '#c4a7e7', primary: '#9ccfd8', accent: '#eb6f92', background: '#191724', surface: '#1f1d2e', onbackground: '#e0def4' },
    },
    {
      key: 'rose-pine-moon',
      nameKey: 'freeLibraryRosePineMoon',
      colors: { base: '#c4a7e7', primary: '#9ccfd8', accent: '#eb6f92', background: '#232136', surface: '#2a273f', onbackground: '#e0def4' },
    },
    {
      key: 'tokyo-night',
      nameKey: 'freeLibraryTokyoNight',
      colors: { base: '#7aa2f7', primary: '#7aa2f7', accent: '#bb9af7', background: '#1a1b26', surface: '#16161e', onbackground: '#c0caf5' },
    },
    {
      key: 'tokyo-night-storm',
      nameKey: 'freeLibraryTokyoNightStorm',
      colors: { base: '#7aa2f7', primary: '#7aa2f7', accent: '#bb9af7', background: '#24283b', surface: '#1f2335', onbackground: '#c0caf5' },
    },
    {
      key: 'tokyo-night-moon',
      nameKey: 'freeLibraryTokyoNightMoon',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#fca7ea', background: '#222436', surface: '#1e2030', onbackground: '#c8d3f5' },
    },
    {
      key: 'everforest-dark-hard',
      nameKey: 'freeLibraryEverforestDarkHard',
      colors: { base: '#a7c080', primary: '#7fbbb3', accent: '#e69875', background: '#272e33', surface: '#2e383c', onbackground: '#d3c6aa' },
    },
    {
      key: 'everforest-dark',
      nameKey: 'freeLibraryEverforestDark',
      colors: { base: '#a7c080', primary: '#7fbbb3', accent: '#e69875', background: '#2d353b', surface: '#343f44', onbackground: '#d3c6aa' },
    },
    {
      key: 'everforest-dark-soft',
      nameKey: 'freeLibraryEverforestDarkSoft',
      colors: { base: '#a7c080', primary: '#7fbbb3', accent: '#e69875', background: '#333c43', surface: '#3a464c', onbackground: '#d3c6aa' },
    },
    {
      key: 'ayu-dark',
      nameKey: 'freeLibraryAyuDark',
      colors: { base: '#e6b450', primary: '#e6b450', accent: '#59c2ff', background: '#10141c', surface: '#0d1017', onbackground: '#bfbdb6' },
    },
    {
      key: 'ayu-mirage',
      nameKey: 'freeLibraryAyuMirage',
      colors: { base: '#ffcc66', primary: '#ffcc66', accent: '#73d0ff', background: '#242936', surface: '#282e3b', onbackground: '#cccac2' },
    },
    {
      key: 'cupertino-dark',
      nameKey: 'freeLibraryCupertinoDark',
      colors: { base: '#0091ff', primary: '#0091ff', accent: '#ff375f', background: '#1e1e1e', surface: '#292929', onbackground: '#dddddd' },
    },
    {
      key: 'dracula',
      nameKey: 'freeLibraryDracula',
      colors: { base: '#bd93f9', primary: '#bd93f9', accent: '#ff79c6', background: '#282a36', surface: '#343746', onbackground: '#f8f8f2' },
    },
    {
      key: 'monokai',
      nameKey: 'freeLibraryMonokai',
      colors: { base: '#f92672', primary: '#66d9ef', accent: '#f92672', background: '#272822', surface: '#1e1f1c', onbackground: '#f8f8f2' },
    },
    {
      key: 'nord',
      nameKey: 'freeLibraryNord',
      colors: { base: '#88c0d0', primary: '#88c0d0', accent: '#b48ead', background: '#2e3440', surface: '#3b4252', onbackground: '#d8dee9' },
    },
    {
      key: 'flexoki-dark',
      nameKey: 'freeLibraryFlexokiDark',
      colors: { base: '#4385be', primary: '#4385be', accent: '#ce5d97', background: '#100f0f', surface: '#1c1b1a', onbackground: '#cecdc3' },
    },
    {
      key: 'kanagawa-wave',
      nameKey: 'freeLibraryKanagawaWave',
      colors: { base: '#7e9cd8', primary: '#7e9cd8', accent: '#d27e99', background: '#1f1f28', surface: '#2a2a37', onbackground: '#dcd7ba' },
    },
    {
      key: 'kanagawa-dragon',
      nameKey: 'freeLibraryKanagawaDragon',
      colors: { base: '#8ba4b0', primary: '#8ba4b0', accent: '#c4746e', background: '#181616', surface: '#282727', onbackground: '#c5c9c5' },
    },
    {
      key: 'night-owl',
      nameKey: 'freeLibraryNightOwl',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#011627', surface: '#001122', onbackground: '#d6deeb' },
    },
    {
      key: 'tomorrow-night',
      nameKey: 'freeLibraryTomorrowNight',
      colors: { base: '#81a2be', primary: '#81a2be', accent: '#b294bb', background: '#1d1f21', surface: '#282a2e', onbackground: '#c5c8c6' },
    },
    {
      key: 'tomorrow-night-eighties',
      nameKey: 'freeLibraryTomorrowNightEighties',
      colors: { base: '#6699cc', primary: '#6699cc', accent: '#cc99cc', background: '#2d2d2d', surface: '#393939', onbackground: '#cccccc' },
    },
    {
      key: 'tomorrow-night-blue',
      nameKey: 'freeLibraryTomorrowNightBlue',
      colors: { base: '#bbdaff', primary: '#bbdaff', accent: '#ebbbff', background: '#002451', surface: '#003f8e', onbackground: '#ffffff' },
    },
    {
      key: 'tomorrow-night-bright',
      nameKey: 'freeLibraryTomorrowNightBright',
      colors: { base: '#7aa6da', primary: '#7aa6da', accent: '#c397d8', background: '#000000', surface: '#2a2a2a', onbackground: '#dedede' },
    },
    {
      key: 'zenburn',
      nameKey: 'freeLibraryZenburn',
      colors: { base: '#8cd0d3', primary: '#8cd0d3', accent: '#dc8cc3', background: '#3f3f3f', surface: '#4f4f4f', onbackground: '#dcdccc' },
    },
    {
      key: 'cobalt2',
      nameKey: 'freeLibraryCobalt2',
      colors: { base: '#ffc600', primary: '#ffc600', accent: '#ff68b8', background: '#193549', surface: '#122738', onbackground: '#ffffff' },
    },
    {
      key: 'github-dark-default',
      nameKey: 'freeLibraryGitHubDarkDefault',
      colors: { base: '#2f81f7', primary: '#58a6ff', accent: '#bc8cff', background: '#0d1117', surface: '#010409', onbackground: '#e6edf3' },
    },
    {
      key: 'github-dark-high-contrast',
      nameKey: 'freeLibraryGitHubDarkHighContrast',
      colors: { base: '#4493f8', primary: '#4493f8', accent: '#a371f7', background: '#0a0c10', surface: '#000000', onbackground: '#f0f3f6' },
    },
    {
      key: 'github-dark-colorblind',
      nameKey: 'freeLibraryGitHubDarkColorblind',
      colors: { base: '#58a6ff', primary: '#58a6ff', accent: '#d29922', background: '#0d1117', surface: '#010409', onbackground: '#e6edf3' },
    },
    {
      key: 'github-dark-dimmed',
      nameKey: 'freeLibraryGitHubDarkDimmed',
      colors: { base: '#539bf5', primary: '#539bf5', accent: '#b083f0', background: '#22272e', surface: '#2d333b', onbackground: '#adbac7' },
    },
    {
      key: 'github-dark-legacy',
      nameKey: 'freeLibraryGitHubDarkLegacy',
      colors: { base: '#79b8ff', primary: '#79b8ff', accent: '#b392f0', background: '#24292e', surface: '#1f2428', onbackground: '#e1e4e8' },
    },
    {
      key: 'material-default',
      nameKey: 'freeLibraryMaterialDefault',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#263238', surface: '#1e272c', onbackground: '#eeffff' },
    },
    {
      key: 'material-darker',
      nameKey: 'freeLibraryMaterialDarker',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#212121', surface: '#1a1a1a', onbackground: '#eeffff' },
    },
    {
      key: 'material-ocean',
      nameKey: 'freeLibraryMaterialOcean',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#0f111a', surface: '#090b10', onbackground: '#a6accd' },
    },
    {
      key: 'material-palenight',
      nameKey: 'freeLibraryMaterialPalenight',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#292d3e', surface: '#212432', onbackground: '#a6accd' },
    },
    {
      key: 'papercolor-dark',
      nameKey: 'freeLibraryPaperColorDark',
      colors: { base: '#5fafd7', primary: '#5fafd7', accent: '#d7875f', background: '#1c1c1c', surface: '#303030', onbackground: '#d0d0d0' },
    },
    {
      key: 'base16-default-dark',
      nameKey: 'freeLibraryBase16DefaultDark',
      colors: { base: '#7cafc2', primary: '#7cafc2', accent: '#ba8baf', background: '#181818', surface: '#282828', onbackground: '#d8d8d8' },
    },
    {
      key: 'blue-topaz-dark',
      nameKey: 'freeLibraryBlueTopazDark',
      colors: { base: '#2d82cd', primary: '#478fee', accent: '#c594d4', background: '#202020', surface: '#151515', onbackground: '#c6c6c6' },
    },
    {
      key: 'its-dark',
      nameKey: 'freeLibraryITSDark',
      colors: { base: '#863737', primary: '#e05858', accent: '#61afef', background: '#1a1e24', surface: '#0b0f13', onbackground: '#bccad8' },
    },
    {
      key: 'border-dark',
      nameKey: 'freeLibraryBorderDark',
      colors: { base: '#707bc2', primary: '#89bdf4', accent: '#cb9eff', background: '#27282e', surface: '#24252a', onbackground: '#d3d5de' },
    },
    {
      key: 'iceberg-dark',
      nameKey: 'freeLibraryIcebergDark',
      colors: { base: '#85a0c7', primary: '#85a0c7', accent: '#a093c8', background: '#161822', surface: '#1f2233', onbackground: '#c7c9d1' },
    },
    {
      key: 'horizon-dark',
      nameKey: 'freeLibraryHorizonDark',
      colors: { base: '#e95678', primary: '#e95678', accent: '#b877db', background: '#1c1e26', surface: '#16161c', onbackground: '#fdf0ed' },
    },
    {
      key: 'nightfox',
      nameKey: 'freeLibraryNightfox',
      colors: { base: '#719cd6', primary: '#719cd6', accent: '#9d79d6', background: '#192330', surface: '#131a24', onbackground: '#cdcecf' },
    },
    {
      key: 'duskfox',
      nameKey: 'freeLibraryDuskfox',
      colors: { base: '#c4a7e7', primary: '#9ccfd8', accent: '#eb6f92', background: '#232136', surface: '#191726', onbackground: '#e0def4' },
    },
    {
      key: 'nordfox',
      nameKey: 'freeLibraryNordfox',
      colors: { base: '#88c0d0', primary: '#88c0d0', accent: '#b48ead', background: '#2e3440', surface: '#232831', onbackground: '#cdcecf' },
    },
    {
      key: 'terafox',
      nameKey: 'freeLibraryTerafox',
      colors: { base: '#ff8349', primary: '#a1cdd8', accent: '#ad5c7c', background: '#152528', surface: '#0f1c1e', onbackground: '#e6eaea' },
    },
    {
      key: 'carbonfox',
      nameKey: 'freeLibraryCarbonfox',
      colors: { base: '#78a9ff', primary: '#78a9ff', accent: '#be95ff', background: '#161616', surface: '#282828', onbackground: '#f2f4f8' },
    },
    {
      key: 'oxocarbon-dark',
      nameKey: 'freeLibraryOxocarbonDark',
      colors: { base: '#78a9ff', primary: '#78a9ff', accent: '#ee5396', background: '#161616', surface: '#262626', onbackground: '#d0d0d0' },
    },
    {
      key: 'sonokai-default',
      nameKey: 'freeLibrarySonokaiDefault',
      colors: { base: '#fc5d7c', primary: '#76cce0', accent: '#b39df3', background: '#2c2e34', surface: '#33353f', onbackground: '#e2e2e3' },
    },
    {
      key: 'sonokai-shusia',
      nameKey: 'freeLibrarySonokaiShusia',
      colors: { base: '#f85e84', primary: '#7accd7', accent: '#ab9df2', background: '#2d2a2e', surface: '#37343a', onbackground: '#e3e1e4' },
    },
    {
      key: 'sonokai-andromeda',
      nameKey: 'freeLibrarySonokaiAndromeda',
      colors: { base: '#fb617e', primary: '#6dcae8', accent: '#bb97ee', background: '#2b2d3a', surface: '#333648', onbackground: '#e1e3e4' },
    },
    {
      key: 'sonokai-atlantis',
      nameKey: 'freeLibrarySonokaiAtlantis',
      colors: { base: '#ff6578', primary: '#72cce8', accent: '#ba9cf3', background: '#2a2f38', surface: '#333846', onbackground: '#e1e3e4' },
    },
    {
      key: 'sonokai-maia',
      nameKey: 'freeLibrarySonokaiMaia',
      colors: { base: '#f76c7c', primary: '#78cee9', accent: '#baa0f8', background: '#273136', surface: '#313b42', onbackground: '#e1e2e3' },
    },
    {
      key: 'sonokai-espresso',
      nameKey: 'freeLibrarySonokaiEspresso',
      colors: { base: '#f86882', primary: '#81d0c9', accent: '#9fa0e1', background: '#312c2b', surface: '#393230', onbackground: '#e4e3e1' },
    },
    {
      key: 'gotham',
      nameKey: 'freeLibraryGotham',
      colors: { base: '#599cab', primary: '#599cab', accent: '#edb443', background: '#0c1014', surface: '#11151c', onbackground: '#d3ebe9' },
    },
    {
      key: 'srcery',
      nameKey: 'freeLibrarySrcery',
      colors: { base: '#fbb829', primary: '#68a8e4', accent: '#ff5c8f', background: '#121110', surface: '#1c1b19', onbackground: '#fce8c3' },
    },
    {
      key: 'shades-of-purple',
      nameKey: 'freeLibraryShadesOfPurple',
      colors: { base: '#fad000', primary: '#fad000', accent: '#ff2c70', background: '#2d2b55', surface: '#1e1e3f', onbackground: '#ffffff' },
    },
    {
      key: 'molokai',
      nameKey: 'freeLibraryMolokai',
      colors: { base: '#f92672', primary: '#66d9ef', accent: '#f92672', background: '#1b1d1e', surface: '#232526', onbackground: '#f8f8f2' },
    },
    {
      key: 'jellybeans',
      nameKey: 'freeLibraryJellybeans',
      colors: { base: '#fad07a', primary: '#8197bf', accent: '#c6b6ee', background: '#151515', surface: '#1c1c1c', onbackground: '#e8e8d3' },
    },
    {
      key: 'badwolf',
      nameKey: 'freeLibraryBadwolf',
      colors: { base: '#0a9dff', primary: '#0a9dff', accent: '#ff2c4b', background: '#1c1b1a', surface: '#242321', onbackground: '#f8f6f2' },
    },
    {
      key: 'apprentice',
      nameKey: 'freeLibraryApprentice',
      colors: { base: '#87afd7', primary: '#87afd7', accent: '#ff8700', background: '#262626', surface: '#1c1c1c', onbackground: '#bcbcbc' },
    },
    {
      key: 'hybrid-dark-reduced',
      nameKey: 'freeLibraryHybridDarkReduced',
      colors: { base: '#81a2be', primary: '#81a2be', accent: '#b294bb', background: '#232c31', surface: '#2d3c46', onbackground: '#c5c8c6' },
    },
    {
      key: 'hemisu-dark',
      nameKey: 'freeLibraryHemisuDark',
      colors: { base: '#9fd3e6', primary: '#9fd3e6', accent: '#b1d631', background: '#000000', surface: '#111111', onbackground: '#eeeeee' },
    },
    {
      key: 'oceanic-next',
      nameKey: 'freeLibraryOceanicNext',
      colors: { base: '#6699cc', primary: '#6699cc', accent: '#c594c5', background: '#1b2b34', surface: '#343d46', onbackground: '#c0c5ce' },
    },
    {
      key: 'seti',
      nameKey: 'freeLibrarySeti',
      colors: { base: '#519aba', primary: '#519aba', accent: '#a074c4', background: '#0e1112', surface: '#15191b', onbackground: '#d4d7d6' },
    },
    {
      key: 'synthwave-84',
      nameKey: 'freeLibrarySynthWave84',
      colors: { base: '#ff7edb', primary: '#03edf9', accent: '#ff7edb', background: '#262335', surface: '#241b2f', onbackground: '#ffffff' },
    },
    {
      key: 'poimandres',
      nameKey: 'freeLibraryPoimandres',
      colors: { base: '#5de4c7', primary: '#add7ff', accent: '#f087bd', background: '#1b1e28', surface: '#303340', onbackground: '#a6accd' },
    },
    {
      key: 'poimandres-storm',
      nameKey: 'freeLibraryPoimandresStorm',
      colors: { base: '#5de4c7', primary: '#add7ff', accent: '#f087bd', background: '#252b37', surface: '#404350', onbackground: '#a6accd' },
    },
    {
      key: 'vesper',
      nameKey: 'freeLibraryVesper',
      colors: { base: '#ffc799', primary: '#ffc799', accent: '#99ffe4', background: '#101010', surface: '#1c1c1c', onbackground: '#ffffff' },
    },
    {
      key: 'moonfly',
      nameKey: 'freeLibraryMoonfly',
      colors: { base: '#80a0ff', primary: '#80a0ff', accent: '#cf87e8', background: '#080808', surface: '#323437', onbackground: '#bdbdbd' },
    },
    {
      key: 'nightfly',
      nameKey: 'freeLibraryNightfly',
      colors: { base: '#82aaff', primary: '#82aaff', accent: '#c792ea', background: '#011627', surface: '#1d3b53', onbackground: '#bdc1c6' },
    },
    {
      key: 'edge-dark',
      nameKey: 'freeLibraryEdgeDark',
      colors: { base: '#6cb6eb', primary: '#6cb6eb', accent: '#d38aea', background: '#2c2e34', surface: '#33353f', onbackground: '#c5cdd9' },
    },
    {
      key: 'edge-aura',
      nameKey: 'freeLibraryEdgeAura',
      colors: { base: '#6cb6eb', primary: '#6cb6eb', accent: '#d38aea', background: '#2b2d37', surface: '#333644', onbackground: '#c5cdd9' },
    },
    {
      key: 'edge-neon',
      nameKey: 'freeLibraryEdgeNeon',
      colors: { base: '#6cb6eb', primary: '#6cb6eb', accent: '#d38aea', background: '#2b2d3a', surface: '#333648', onbackground: '#c5cdd9' },
    },
    {
      key: 'gruvbox-material-dark-hard-material',
      nameKey: 'freeLibraryGruvboxMaterialDarkHardMaterial',
      colors: { base: '#7daea3', primary: '#7daea3', accent: '#d3869b', background: '#1d2021', surface: '#282828', onbackground: '#d4be98' },
    },
    {
      key: 'gruvbox-material-dark-hard-mix',
      nameKey: 'freeLibraryGruvboxMaterialDarkHardMix',
      colors: { base: '#80aa9e', primary: '#80aa9e', accent: '#d3869b', background: '#1d2021', surface: '#282828', onbackground: '#e2cca9' },
    },
    {
      key: 'gruvbox-material-dark-hard-original',
      nameKey: 'freeLibraryGruvboxMaterialDarkHardOriginal',
      colors: { base: '#83a598', primary: '#83a598', accent: '#d3869b', background: '#1d2021', surface: '#282828', onbackground: '#ebdbb2' },
    },
    {
      key: 'gruvbox-material-dark-medium-material',
      nameKey: 'freeLibraryGruvboxMaterialDarkMediumMaterial',
      colors: { base: '#7daea3', primary: '#7daea3', accent: '#d3869b', background: '#282828', surface: '#32302f', onbackground: '#d4be98' },
    },
    {
      key: 'gruvbox-material-dark-medium-mix',
      nameKey: 'freeLibraryGruvboxMaterialDarkMediumMix',
      colors: { base: '#80aa9e', primary: '#80aa9e', accent: '#d3869b', background: '#282828', surface: '#32302f', onbackground: '#e2cca9' },
    },
    {
      key: 'gruvbox-material-dark-medium-original',
      nameKey: 'freeLibraryGruvboxMaterialDarkMediumOriginal',
      colors: { base: '#83a598', primary: '#83a598', accent: '#d3869b', background: '#282828', surface: '#32302f', onbackground: '#ebdbb2' },
    },
    {
      key: 'gruvbox-material-dark-soft-material',
      nameKey: 'freeLibraryGruvboxMaterialDarkSoftMaterial',
      colors: { base: '#7daea3', primary: '#7daea3', accent: '#d3869b', background: '#32302f', surface: '#3c3836', onbackground: '#d4be98' },
    },
    {
      key: 'gruvbox-material-dark-soft-mix',
      nameKey: 'freeLibraryGruvboxMaterialDarkSoftMix',
      colors: { base: '#80aa9e', primary: '#80aa9e', accent: '#d3869b', background: '#32302f', surface: '#3c3836', onbackground: '#e2cca9' },
    },
    {
      key: 'gruvbox-material-dark-soft-original',
      nameKey: 'freeLibraryGruvboxMaterialDarkSoftOriginal',
      colors: { base: '#83a598', primary: '#83a598', accent: '#d3869b', background: '#32302f', surface: '#3c3836', onbackground: '#ebdbb2' },
    },
    {
      key: 'primary-dark',
      nameKey: 'freeLibraryPrimaryDark',
      colors: { base: '#4db2d1', primary: '#4db2d1', accent: '#f35044', background: '#2a241d', surface: '#241f19', onbackground: '#ebdac6' },
    },
    {
      key: 'sanctum-dark',
      nameKey: 'freeLibrarySanctumDark',
      colors: { base: '#669961', primary: '#669961', accent: '#f3bd4f', background: '#161616', surface: '#262625', onbackground: '#f4f4f0' },
    },
    {
      key: 'sanctum-black',
      nameKey: 'freeLibrarySanctumBlack',
      colors: { base: '#669961', primary: '#669961', accent: '#f3bd4f', background: '#000000', surface: '#161616', onbackground: '#c7c5c2' },
    },
    {
      key: 'cyber-glow-dark',
      nameKey: 'freeLibraryCyberGlowDark',
      colors: { base: '#00ffff', primary: '#00ffff', accent: '#ff00ff', background: '#0a0a0f', surface: '#181825', onbackground: '#e0e0e8' },
    },
    {
      key: 'prism-raven',
      nameKey: 'freeLibraryPrismRaven',
      colors: { base: '#bc9ee0', primary: '#bc9ee0', accent: '#e792bd', background: '#2e2e2e', surface: '#1f1f1f', onbackground: '#e8e8e8' },
    },
    {
      key: 'prism-mocha',
      nameKey: 'freeLibraryPrismMocha',
      colors: { base: '#b799db', primary: '#b799db', accent: '#e189b7', background: '#402b1c', surface: '#2b1d12', onbackground: '#f1e7df' },
    },
    {
      key: 'prism-indigo',
      nameKey: 'freeLibraryPrismIndigo',
      colors: { base: '#b799db', primary: '#b799db', accent: '#e189b7', background: '#1f2947', surface: '#141b2e', onbackground: '#dfe3f1' },
    },
    {
      key: 'prism-pine',
      nameKey: 'freeLibraryPrismPine',
      colors: { base: '#bb9ddd', primary: '#bb9ddd', accent: '#e392ba', background: '#173519', surface: '#0e200f', onbackground: '#e6f4e7' },
    },
    {
      key: 'prism-cherry',
      nameKey: 'freeLibraryPrismCherry',
      colors: { base: '#bda1de', primary: '#bda1de', accent: '#e495bd', background: '#481b19', surface: '#2d1110', onbackground: '#f6e5e5' },
    },
    {
      key: 'flomo-dark',
      nameKey: 'freeLibraryFlomoDark',
      colors: { base: '#30cf79', primary: '#30cf79', accent: '#30cf79', background: '#111613', surface: '#1a211d', onbackground: '#e7ebe8' },
    },
    {
      key: 'notion-dark',
      nameKey: 'freeLibraryNotionDark',
      colors: { base: '#62aef0', primary: '#62aef0', accent: '#f64932', background: '#191919', surface: '#2f3437', onbackground: '#f1f1ef' },
    },
    {
      key: 'wolai-dark',
      nameKey: 'freeLibraryWolaiDark',
      colors: { base: '#cf5659', primary: '#e07075', accent: '#cf5659', background: '#1a1a1c', surface: '#141416', onbackground: '#e8e8e8' },
    },
    {
      key: 'rednote-dark',
      nameKey: 'freeLibraryRedNoteDark',
      colors: { base: '#ff2e4d', primary: '#ff2e4d', accent: '#fdbc5f', background: '#19191e', surface: '#0e0e11', onbackground: '#dadadb' },
    },
    {
      key: 'linear-dark',
      nameKey: 'freeLibraryLinearDark',
      colors: { base: '#5e6ad2', primary: '#7170ff', accent: '#828fff', background: '#08090a', surface: '#191a1b', onbackground: '#f7f8f8' },
    },
    {
      key: 'figma-dark',
      nameKey: 'freeLibraryFigmaDark',
      colors: { base: '#0d99ff', primary: '#0d99ff', accent: '#f24822', background: '#1e1e1e', surface: '#2c2c2c', onbackground: '#ffffff' },
    },
    {
      key: 'bear-dark-graphite',
      nameKey: 'freeLibraryBearDarkGraphite',
      colors: { base: '#e2494c', primary: '#d96556', accent: '#ff7272', background: '#171717', surface: '#212224', onbackground: '#eeeeee' },
    },
    {
      key: 'bear-dieci',
      nameKey: 'freeLibraryBearDieci',
      colors: { base: '#ff9500', primary: '#ff9500', accent: '#ff9500', background: '#000000', surface: '#1c1c1c', onbackground: '#ffffff' },
    },
    {
      key: 'craft-dark',
      nameKey: 'freeLibraryCraftDark',
      colors: { base: '#8b87ff', primary: '#8b87ff', accent: '#ff8a65', background: '#1c1c1e', surface: '#29292d', onbackground: '#f5f5f7' },
    },
    {
      key: 'feishu-dark',
      nameKey: 'freeLibraryFeiShuDark',
      colors: { base: '#4e83fd', primary: '#85a5ff', accent: '#38d6c4', background: '#0f121a', surface: '#171b27', onbackground: '#e5e6eb' },
    },
    {
      key: 'apple-notes-dark',
      nameKey: 'freeLibraryAppleNotesDark',
      colors: { base: '#ffd60a', primary: '#ffd60a', accent: '#ff9f0a', background: '#1c1c1e', surface: '#2c2c2e', onbackground: '#f2f2f7' },
    },
    {
      key: 'heptabase-dark',
      nameKey: 'freeLibraryHeptabaseDark',
      colors: { base: '#8c7cf0', primary: '#9b8cf2', accent: '#ff8a65', background: '#1d1f23', surface: '#292c32', onbackground: '#eef0f3' },
    },
    {
      key: 'capacities-dark',
      nameKey: 'freeLibraryCapacitiesDark',
      colors: { base: '#8d85ff', primary: '#9b94ff', accent: '#f0a46b', background: '#1c1b1a', surface: '#292622', onbackground: '#ede9e3' },
    },
    {
      key: 'anytype-dark',
      nameKey: 'freeLibraryAnytypeDark',
      colors: { base: '#ffb522', primary: '#ffd15b', accent: '#ab50cc', background: '#171717', surface: '#252525', onbackground: '#f2f2f2' },
    },
    {
      key: 'arc-dark',
      nameKey: 'freeLibraryArcDark',
      colors: { base: '#a78bfa', primary: '#a78bfa', accent: '#ff7aa8', background: '#17131c', surface: '#241c2d', onbackground: '#f5f0f7' },
    },
    {
      key: 'raycast-dark',
      nameKey: 'freeLibraryRaycastDark',
      colors: { base: '#ff6363', primary: '#ff6363', accent: '#ff6363', background: '#151515', surface: '#202123', onbackground: '#ffffff' },
    },
    {
      key: 'vercel-dark',
      nameKey: 'freeLibraryVercelDark',
      colors: { base: '#ffffff', primary: '#52a8ff', accent: '#0070f3', background: '#000000', surface: '#111111', onbackground: '#ededed' },
    },
    {
      key: 'slack-dark',
      nameKey: 'freeLibrarySlackDark',
      colors: { base: '#7c3085', primary: '#36c5f0', accent: '#e01e5a', background: '#1a1d21', surface: '#19171d', onbackground: '#d1d2d3' },
    },
    {
      key: 'anuppuccin-amoled',
      nameKey: 'freeLibraryAnuPpuccinAMOLED',
      colors: { base: '#87b0f9', primary: '#87b0f9', accent: '#cba6f7', background: '#0a0a0a', surface: '#050505', onbackground: '#ffffff' },
    },
    {
      key: 'anuppuccin-biscuit-dark',
      nameKey: 'freeLibraryAnuPpuccinBiscuitDark',
      colors: { base: '#dbb17f', primary: '#dbb17f', accent: '#ae3f82', background: '#1b1515', surface: '#261a1a', onbackground: '#ffe9c7' },
    },
    {
      key: 'anuppuccin-coffee-dark',
      nameKey: 'freeLibraryAnuPpuccinCoffeeDark',
      colors: { base: '#c99a6b', primary: '#d4b08c', accent: '#a8755d', background: '#1f1b18', surface: '#2b2520', onbackground: '#e7d7c9' },
    },
    {
      key: 'anuppuccin-generic-dark',
      nameKey: 'freeLibraryAnuPpuccinGenericDark',
      colors: { base: '#8aadf4', primary: '#8aadf4', accent: '#c6a0f6', background: '#202020', surface: '#292929', onbackground: '#dedede' },
    },
    {
      key: 'anuppuccin-material-mint-dark',
      nameKey: 'freeLibraryAnuPpuccinMaterialMintDark',
      colors: { base: '#80cbc4', primary: '#80cbc4', accent: '#c792ea', background: '#263238', surface: '#1f292e', onbackground: '#eeffff' },
    },
    {
      key: 'anuppuccin-rosebox',
      nameKey: 'freeLibraryAnuPpuccinRosebox',
      colors: { base: '#a57562', primary: '#c49a86', accent: '#d3869b', background: '#1f1b1a', surface: '#2a2422', onbackground: '#ead8cf' },
    },
    {
      key: 'anuppuccin-royal-velvet',
      nameKey: 'freeLibraryAnuPpuccinRoyalVelvet',
      colors: { base: '#b794f6', primary: '#b794f6', accent: '#f78da7', background: '#21182c', surface: '#2d203a', onbackground: '#eadcf8' },
    },
    {
      key: 'anuppuccin-thorns',
      nameKey: 'freeLibraryAnuPpuccinThorns',
      colors: { base: '#8fb573', primary: '#9fc483', accent: '#d06c75', background: '#162019', surface: '#1f2b22', onbackground: '#d8e2d5' },
    },
    {
      key: 'border-sunset',
      nameKey: 'freeLibraryBorderSunset',
      colors: { base: '#f08c6c', primary: '#f2a184', accent: '#df6c93', background: '#251b21', surface: '#332129', onbackground: '#f1d9d2' },
    },
    {
      key: 'border-lightup',
      nameKey: 'freeLibraryBorderLightup',
      colors: { base: '#83a9ff', primary: '#83a9ff', accent: '#cb9eff', background: '#18191f', surface: '#22242c', onbackground: '#d9dbe5' },
    },
    {
      key: 'border-lightup-alt',
      nameKey: 'freeLibraryBorderLightupAlt',
      colors: { base: '#69c7d8', primary: '#69c7d8', accent: '#d797e8', background: '#17191d', surface: '#21242a', onbackground: '#dedfe4' },
    },
    {
      key: 'border-lightdown-green',
      nameKey: 'freeLibraryBorderLightdownGreen',
      colors: { base: '#79c99e', primary: '#79c99e', accent: '#a3d97d', background: '#171b19', surface: '#111411', onbackground: '#dce5df' },
    },
    {
      key: 'border-lightdown-pink',
      nameKey: 'freeLibraryBorderLightdownPink',
      colors: { base: '#df83b5', primary: '#df83b5', accent: '#c79be8', background: '#1b171a', surface: '#131013', onbackground: '#e7dce3' },
    },
    {
      key: 'border-lightdown-blue',
      nameKey: 'freeLibraryBorderLightdownBlue',
      colors: { base: '#79aef2', primary: '#79aef2', accent: '#9c92e8', background: '#15191f', surface: '#101317', onbackground: '#dce2ea' },
    },
    {
      key: 'border-lightdown-orange',
      nameKey: 'freeLibraryBorderLightdownOrange',
      colors: { base: '#e5a266', primary: '#e5a266', accent: '#d47b70', background: '#1d1916', surface: '#14110f', onbackground: '#e7dfd7' },
    },
    {
      key: 'border-justblack',
      nameKey: 'freeLibraryBorderJustblack',
      colors: { base: '#a78bfa', primary: '#a78bfa', accent: '#f472b6', background: '#000000', surface: '#101010', onbackground: '#eeeeee' },
    },
    {
      key: 'its-adventure-dark',
      nameKey: 'freeLibraryITSAdventureDark',
      colors: { base: '#7bad88', primary: '#e39b59', accent: '#ad4646', background: '#392f2b', surface: '#292321', onbackground: '#e8ded8' },
    },
    {
      key: 'its-drowned-dark',
      nameKey: 'freeLibraryITSDrownedDark',
      colors: { base: '#378876', primary: '#49d8e2', accent: '#5cb2d6', background: '#1a1e24', surface: '#0b0f13', onbackground: '#bccad8' },
    },
    {
      key: 'its-tangerine-dunes-dark',
      nameKey: 'freeLibraryITSTangerineDunesDark',
      colors: { base: '#df7b41', primary: '#e57858', accent: '#df7b41', background: '#1a1e24', surface: '#0b0f13', onbackground: '#bccad8' },
    },
    {
      key: 'its-school-days-dark',
      nameKey: 'freeLibraryITSSchoolDaysDark',
      colors: { base: '#79a7d3', primary: '#79a7d3', accent: '#d66c69', background: '#20242a', surface: '#171a1e', onbackground: '#e1e4e8' },
    },
    {
      key: 'its-slrvb-blue-dark',
      nameKey: 'freeLibraryITSSlRvbBlueDark',
      colors: { base: '#61afef', primary: '#61afef', accent: '#c678dd', background: '#1a1e24', surface: '#0b0f13', onbackground: '#bccad8' },
    },
    {
      key: 'its-slrvb-gray-dark',
      nameKey: 'freeLibraryITSSlRvbGrayDark',
      colors: { base: '#aaaaaa', primary: '#bbbbbb', accent: '#d28181', background: '#202020', surface: '#161616', onbackground: '#dddddd' },
    },
    {
      key: 'its-minimalist-dark',
      nameKey: 'freeLibraryITSMinimalistDark',
      colors: { base: '#8396a8', primary: '#9babb8', accent: '#c48a69', background: '#1a1e24', surface: '#11151a', onbackground: '#d4d9de' },
    },
    {
      key: 'its-dd-dark',
      nameKey: 'freeLibraryITSDDDark',
      colors: { base: '#c23b3e', primary: '#d86767', accent: '#c8a55a', background: '#221b17', surface: '#17120f', onbackground: '#e6dccb' },
    },
    {
      key: 'its-dd-wotc-dark',
      nameKey: 'freeLibraryITSDDWOTCDark',
      colors: { base: '#d33831', primary: '#df6c64', accent: '#bd9b4f', background: '#211c18', surface: '#17130f', onbackground: '#e7ded1' },
    },
    {
      key: 'its-vero-galaxy-dark',
      nameKey: 'freeLibraryITSVeroGalaxyDark',
      colors: { base: '#9b82ee', primary: '#9b82ee', accent: '#df72aa', background: '#171421', surface: '#0f0c17', onbackground: '#e5def2' },
    },
    {
      key: 'encore-obsidian-redux',
      nameKey: 'freeLibraryEncoreObsidianRedux',
      colors: { base: '#9b7df2', primary: '#a78bfa', accent: '#7c3aed', background: '#191919', surface: '#242424', onbackground: '#e4e4e7' },
    },
    {
      key: 'encore-cobalt',
      nameKey: 'freeLibraryEncoreCobalt',
      colors: { base: '#60a5fa', primary: '#60a5fa', accent: '#4ade80', background: '#172033', surface: '#111827', onbackground: '#e5e7eb' },
    },
    {
      key: 'encore-mercury',
      nameKey: 'freeLibraryEncoreMercury',
      colors: { base: '#8b9cf7', primary: '#9caef8', accent: '#c084fc', background: '#27272a', surface: '#18181b', onbackground: '#e4e4e7' },
    },
    {
      key: 'encore-iron',
      nameKey: 'freeLibraryEncoreIron',
      colors: { base: '#d6a36c', primary: '#d6a36c', accent: '#c08457', background: '#292524', surface: '#1c1917', onbackground: '#e7e5e4' },
    },
    {
      key: 'encore-carbon',
      nameKey: 'freeLibraryEncoreCarbon',
      colors: { base: '#a78bfa', primary: '#a78bfa', accent: '#60a5fa', background: '#18181b', surface: '#09090b', onbackground: '#e4e4e7' },
    },
    {
      key: 'encore-blackout',
      nameKey: 'freeLibraryEncoreBlackout',
      colors: { base: '#a78bfa', primary: '#a78bfa', accent: '#60a5fa', background: '#000000', surface: '#090909', onbackground: '#f4f4f5' },
    },
    {
      key: 'encore-rgb',
      nameKey: 'freeLibraryEncoreRGB',
      colors: { base: '#ff4455', primary: '#5ac8fa', accent: '#bf5af2', background: '#18181b', surface: '#09090b', onbackground: '#f4f4f5' },
    },
    {
      key: 'shimmering-focus-dark',
      nameKey: 'freeLibraryShimmeringFocusDark',
      colors: { base: '#8a85e6', primary: '#9d99ef', accent: '#d184ac', background: '#1e1e1e', surface: '#161616', onbackground: '#d8d8d8' },
    },
    {
      key: 'shimmering-focus-gamma-dark',
      nameKey: 'freeLibraryShimmeringFocusGammaDark',
      colors: { base: '#bb9af7', primary: '#bb9af7', accent: '#f7768e', background: '#1f1f28', surface: '#16161d', onbackground: '#d5d6db' },
    },
    {
      key: 'shimmering-focus-coffee-dark',
      nameKey: 'freeLibraryShimmeringFocusCoffeeDark',
      colors: { base: '#c99a6b', primary: '#d2b08b', accent: '#cc6f63', background: '#241e1a', surface: '#191512', onbackground: '#e7ddd2' },
    },
    {
      key: 'magicuser-default-dark',
      nameKey: 'freeLibraryMagicUserDefaultDark',
      colors: { base: '#8b7cf6', primary: '#9b8cff', accent: '#e178a6', background: '#1b1b1f', surface: '#26262c', onbackground: '#e4e4e7' },
    },
    {
      key: 'magicuser-room-lamp-dark',
      nameKey: 'freeLibraryMagicUserRoomLampDark',
      colors: { base: '#d69b63', primary: '#e0ad7d', accent: '#c77862', background: '#211b17', surface: '#2c241e', onbackground: '#eadfd4' },
    },
    {
      key: 'magicuser-purple-dark',
      nameKey: 'freeLibraryMagicUserPurpleDark',
      colors: { base: '#a78bfa', primary: '#a78bfa', accent: '#e879f9', background: '#1c1724', surface: '#271e32', onbackground: '#e9e2ef' },
    },
    {
      key: 'magicuser-teal-dark',
      nameKey: 'freeLibraryMagicUserTealDark',
      colors: { base: '#5fc4b7', primary: '#67d1c3', accent: '#8ebfd1', background: '#15201f', surface: '#1e2b29', onbackground: '#deebe8' },
    },
    {
      key: 'magicuser-gray-dark',
      nameKey: 'freeLibraryMagicUserGrayDark',
      colors: { base: '#9ca3af', primary: '#b0b7c1', accent: '#818cf8', background: '#1c1d20', surface: '#27282d', onbackground: '#e5e7eb' },
    },
    {
      key: 'magicuser-camouflage-dark',
      nameKey: 'freeLibraryMagicUserCamouflageDark',
      colors: { base: '#96a46b', primary: '#a6b67b', accent: '#c99b67', background: '#202219', surface: '#2a2d21', onbackground: '#e2e4d7' },
    },
    {
      key: 'magicuser-moon-dark',
      nameKey: 'freeLibraryMagicUserMoonDark',
      colors: { base: '#91a7ff', primary: '#91a7ff', accent: '#c7a6ff', background: '#151925', surface: '#202638', onbackground: '#dde3f0' },
    },
    {
      key: 'magicuser-teacher-dark',
      nameKey: 'freeLibraryMagicUserTeacherDark',
      colors: { base: '#7ea9d8', primary: '#8eb9e5', accent: '#d79a68', background: '#1a2026', surface: '#242c34', onbackground: '#e2e7eb' },
    },
    {
      key: 'magicuser-creativity-dark',
      nameKey: 'freeLibraryMagicUserCreativityDark',
      colors: { base: '#df7db7', primary: '#e48dc0', accent: '#8d9cf6', background: '#211924', surface: '#2e2132', onbackground: '#eee1e9' },
    },
    {
      key: 'magicuser-concentration-dark',
      nameKey: 'freeLibraryMagicUserConcentrationDark',
      colors: { base: '#6aa9ce', primary: '#7bb8db', accent: '#78c2a4', background: '#172026', surface: '#202b32', onbackground: '#dee7ec' },
    },
    {
      key: 'magicuser-stealth-dark',
      nameKey: 'freeLibraryMagicUserStealthDark',
      colors: { base: '#7e8793', primary: '#a0a6ae', accent: '#8b95a3', background: '#111315', surface: '#1a1d20', onbackground: '#d7d9dc' },
    },
    {
      key: 'claude-dark',
      nameKey: 'freeLibraryClaudeDark',
      colors: { base: '#d97757', primary: '#d97757', accent: '#6a9bcc', background: '#141413', surface: '#1f1f1e', onbackground: '#faf9f5' },
    },
  ],
};
