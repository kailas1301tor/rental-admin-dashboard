import { Monitor, Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/preferences/PreferencesProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/components/ui/Button';
import type { ThemeMode } from '@/types';

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { updatePrefs } = usePreferences();

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    updatePrefs({ themeMode: next });
  }

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const label =
    mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium sm:tracking-wide">
        {label}
      </span>
    </Button>
  );
}
