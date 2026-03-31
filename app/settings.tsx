import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { SUPPORTED_LANGUAGES, LanguageCode, setStoredLanguage, getStoredLanguage } from '../src/i18n';

const SOUND_KEY = '@ghost_tac_toe_sound';
const HAPTICS_KEY = '@ghost_tac_toe_haptics';

function SettingRow({
  emoji,
  title,
  description,
  value,
  onToggle,
  trackColor,
  thumbColor,
}: {
  emoji: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  trackColor?: { false: string; true: string };
  thumbColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={trackColor ?? { false: COLORS.border, true: COLORS.playerXDim }}
        thumbColor={value ? (thumbColor ?? COLORS.playerX) : COLORS.textMuted}
      />
    </View>
  );
}

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
    getStoredLanguage().then((lang) => {
      // Check if it was explicitly stored or just device default
      AsyncStorage.getItem('@ghost_tac_toe_language').then((stored) => {
        setCurrentLang(stored ? stored : 'system');
      });
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
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{backArrow} {t('game.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚙️ {t('settings.title')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Audio & Feel */}
        <View style={[styles.card, styles.cardAccented]}>
          <Text style={styles.cardTitle}>{t('settings.audioFeel')}</Text>
          <SettingRow
            emoji="🔊"
            title={t('settings.soundEffects')}
            description={t('settings.soundDesc')}
            value={soundEnabled}
            onToggle={handleSoundToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            emoji="📳"
            title={t('settings.haptics')}
            description={t('settings.hapticsDesc')}
            value={hapticsEnabled}
            onToggle={handleHapticsToggle}
          />
        </View>

        {/* Language */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌐 {t('settings.language')}</Text>
          <Text style={styles.rowDesc}>{t('settings.languageDesc')}</Text>
          <TouchableOpacity
            style={styles.langSelector}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <Text style={styles.langCurrent}>{currentLangLabel}</Text>
            <Text style={styles.langChevron}>{showLangPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.langList}>
              <TouchableOpacity
                style={[styles.langOption, currentLang === 'system' && styles.langOptionActive]}
                onPress={() => handleLanguageSelect('system')}
              >
                <Text style={[styles.langOptionText, currentLang === 'system' && styles.langOptionTextActive]}>
                  📱 {t('settings.systemDefault')}
                </Text>
              </TouchableOpacity>
              {(Object.entries(SUPPORTED_LANGUAGES) as [LanguageCode, string][]).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langOption, currentLang === code && styles.langOptionActive]}
                  onPress={() => handleLanguageSelect(code)}
                >
                  <Text style={[styles.langOptionText, currentLang === code && styles.langOptionTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.about')}</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('settings.appLabel')}</Text>
            <Text style={styles.aboutValue}>{t('app.name')}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.aboutDesc}>
            {t('settings.aboutDesc')} 👻
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl },
  backBtn: { padding: SPACING.xs, width: 60 },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  cardAccented: { borderTopWidth: 3, borderTopColor: COLORS.playerX },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rowEmoji: { fontSize: FONT_SIZES.xl },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  rowDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  aboutValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600' },
  aboutDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  // Language picker
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  langCurrent: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  langChevron: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  langList: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  langOption: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: COLORS.playerXDim,
  },
  langOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  langOptionTextActive: {
    color: COLORS.playerX,
    fontWeight: '700',
  },
});
