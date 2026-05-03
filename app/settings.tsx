import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDERS,
} from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { SUPPORTED_LANGUAGES, LanguageCode, setStoredLanguage } from '../src/i18n';

const SOUND_KEY = '@ghost_tac_toe_sound';
const HAPTICS_KEY = '@ghost_tac_toe_haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t, i18n } = useTranslation();
  const backArrow = I18nManager.isRTL ? '→' : '←';
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [currentLang, setCurrentLang] = useState<string>('system');
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([SOUND_KEY, HAPTICS_KEY]).then((pairs) => {
      const soundVal = pairs.find(([k]) => k === SOUND_KEY)?.[1];
      const hapticsVal = pairs.find(([k]) => k === HAPTICS_KEY)?.[1];
      setSoundEnabled(soundVal !== 'false');
      setHapticsEnabled(hapticsVal !== 'false');
    });
    AsyncStorage.getItem('@ghost_tac_toe_language').then((stored) => {
      setCurrentLang(stored ? stored : 'system');
    });
  }, []);

  const handleSoundToggle = async (val: boolean) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem(SOUND_KEY, val ? 'true' : 'false');
  };
  const handleHapticsToggle = async (val: boolean) => {
    setHapticsEnabled(val);
    await AsyncStorage.setItem(HAPTICS_KEY, val ? 'true' : 'false');
  };
  const handleLanguageSelect = async (lang: string) => {
    setCurrentLang(lang);
    setShowLangPicker(false);
    await setStoredLanguage(lang);
  };

  const currentLangLabel = currentLang === 'system'
    ? t('settings.systemDefault')
    : SUPPORTED_LANGUAGES[currentLang as LanguageCode] ?? currentLang;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: Math.min(layout.contentMaxWidth, 560) }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>{backArrow}  Return</Text>
          </TouchableOpacity>
        </View>

        {/* Masthead */}
        <View style={styles.masthead}>
          <Text style={styles.eyebrow}>SECTION III  ·  PROVISIONS</Text>
          <View style={styles.doubleRule} />
          <Text style={styles.title}>House Provisions</Text>
          <Text style={styles.subtitle}>Audio, haptics &amp; tongue of preference</Text>
          <View style={styles.singleRule} />
        </View>

        {/* Audio & Haptics */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>SOUND &amp; FEEL</Text>
          <SettingRow
            ornament="♪"
            title="Audible Effects"
            description="Stamps, victories, vanishings"
            value={soundEnabled}
            onToggle={handleSoundToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            ornament="❦"
            title="Haptic Resonance"
            description="A small tremor with each stamp (mobile only)"
            value={hapticsEnabled}
            onToggle={handleHapticsToggle}
          />
        </View>

        {/* Language */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>LANGUAGE OF DISPATCH</Text>
          <TouchableOpacity
            style={styles.langSelector}
            onPress={() => setShowLangPicker(!showLangPicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.langOrnament}>✦</Text>
            <Text style={styles.langCurrent}>{currentLangLabel}</Text>
            <Text style={styles.langChevron}>{showLangPicker ? '▴' : '▾'}</Text>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.langList}>
              <LangOption
                label={t('settings.systemDefault')}
                isActive={currentLang === 'system'}
                onPress={() => handleLanguageSelect('system')}
              />
              {(Object.entries(SUPPORTED_LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
                <LangOption
                  key={code}
                  label={name}
                  isActive={currentLang === code}
                  onPress={() => handleLanguageSelect(code)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Colophon */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>COLOPHON</Text>
          <View style={styles.colophonRow}>
            <Text style={styles.colophonLabel}>Edition</Text>
            <Text style={styles.colophonValue}>I  ·  Vol. 1</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.colophonRow}>
            <Text style={styles.colophonLabel}>Publisher</Text>
            <Text style={styles.colophonValue}>The Ghost Times</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.colophonBlurb}>
            Set in <Text style={styles.colophonItalic}>Yeseva One</Text>, <Text style={styles.colophonItalic}>Crimson Pro</Text> &amp; <Text style={styles.colophonItalic}>Special Elite</Text>.
            Printed nightly by an underpaid apparition. ❦
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  ornament,
  title,
  description,
  value,
  onToggle,
}: {
  ornament: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onToggle(!value)} activeOpacity={0.7}>
      <Text style={styles.rowOrnament}>{ornament}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <View style={[styles.toggleBox, value && styles.toggleBoxOn]}>
        <Text style={[styles.toggleCheck, value && styles.toggleCheckOn]}>
          {value ? '✓' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function LangOption({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.langOption, isActive && styles.langOptionActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.langOptionGlyph, isActive && styles.langOptionGlyphActive]}>
        {isActive ? '✕' : '·'}
      </Text>
      <Text style={[styles.langOptionText, isActive && styles.langOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignSelf: 'center',
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  backBtn: { paddingVertical: SPACING.xs },
  backText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textBrass,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  masthead: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 2.2,
    marginBottom: 4,
  },
  doubleRule: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.rule,
    marginVertical: 2,
  },
  singleRule: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.rule,
    marginTop: 2,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.textPrimary,
    marginVertical: SPACING.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.sm + 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  card: {
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.rule,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  rowOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
    width: 24,
    textAlign: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  rowDesc: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  toggleBox: {
    width: 26,
    height: 26,
    borderWidth: BORDERS.rule,
    borderColor: COLORS.rule,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxOn: {
    backgroundColor: COLORS.playerX,
    borderColor: COLORS.playerX,
  },
  toggleCheck: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: 'transparent',
    lineHeight: FONT_SIZES.md,
  },
  toggleCheckOn: {
    color: COLORS.background,
  },

  // Language
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.border,
  },
  langOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textBrass,
  },
  langCurrent: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.textPrimary,
    flex: 1,
  },
  langChevron: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
  },
  langList: {
    marginTop: SPACING.sm,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.border,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: COLORS.surfaceBright,
  },
  langOptionGlyph: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    width: 16,
    textAlign: 'center',
  },
  langOptionGlyphActive: {
    color: COLORS.playerX,
  },
  langOptionText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  langOptionTextActive: {
    color: COLORS.textPrimary,
  },

  // Colophon
  colophonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
  },
  colophonLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  colophonValue: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  colophonBlurb: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    lineHeight: FONT_SIZES.sm * 1.6,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  colophonItalic: {
    fontWeight: '700',
  },
});
