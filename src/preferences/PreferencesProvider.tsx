import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  applyAccentColor,
  loadStoredPreferences,
  persistPreferences,
  setLocalePreferences,
  type LocalePreferences,
} from '@/lib/preferences-store';
import { useTheme } from '@/theme/ThemeProvider';
import type { AccentColorId } from '@/types';

interface PreferencesContextValue {
  prefs: LocalePreferences;
  updatePrefs: (patch: Partial<LocalePreferences>) => void;
  savePrefs: (next: LocalePreferences) => void;
  setAccent: (id: AccentColorId) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { resolved, setMode } = useTheme();
  const [prefs, setPrefs] = useState<LocalePreferences>(() => {
    const stored = loadStoredPreferences();
    setLocalePreferences(stored);
    return stored;
  });
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    setMode(prefs.themeMode);
  }, [prefs.themeMode, setMode]);

  useEffect(() => {
    applyAccentColor(prefs.accentColor, resolved);
  }, [prefs.accentColor, resolved]);

  const updatePrefs = useCallback(
    (patch: Partial<LocalePreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        setLocalePreferences(next);
        if (patch.themeMode) setMode(patch.themeMode);
        if (patch.accentColor) {
          applyAccentColor(patch.accentColor, resolved);
        }
        return next;
      });
    },
    [resolved, setMode],
  );

  const savePrefs = useCallback(
    (next: LocalePreferences) => {
      persistPreferences(next);
      setPrefs(next);
      setLocalePreferences(next);
      setMode(next.themeMode);
      applyAccentColor(next.accentColor, resolved);
    },
    [resolved, setMode],
  );

  const setAccent = useCallback(
    (id: AccentColorId) => {
      updatePrefs({ accentColor: id });
    },
    [updatePrefs],
  );

  const value = useMemo(
    () => ({ prefs, updatePrefs, savePrefs, setAccent }),
    [prefs, updatePrefs, savePrefs, setAccent],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
