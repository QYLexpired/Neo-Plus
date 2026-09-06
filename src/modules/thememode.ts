export function getThemeMode(): 'light' | 'dark' {
  const mode = document.documentElement.getAttribute('data-theme-mode');
  return mode === 'dark' ? 'dark' : 'light';
}