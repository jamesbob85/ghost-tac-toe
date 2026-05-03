import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  Platform,
} from 'react-native';
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
import { AppStats, Difficulty } from '../src/types/game';
import { loadStats, resetStats, createEmptyStats } from '../src/store/statsStore';

const DIFF_DESCRIPTORS: Record<Difficulty, string> = {
  easy: 'Novice spirit',
  medium: 'Keen apparition',
  hard: 'Vengeful poltergeist',
};

export default function ScoresScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '→' : '←';
  const [stats, setStats] = useState<AppStats>(createEmptyStats());

  useEffect(() => {
    loadStats().then(setStats);
  }, []);

  const promptReset = () => {
    const doReset = async () => {
      const fresh = await resetStats();
      setStats(fresh);
    };
    if (Platform.OS === 'web') {
      // RN Alert is a no-op on web
      // eslint-disable-next-line no-alert
      const ok = typeof window !== 'undefined' && window.confirm(
        'Strike all entries from the registry? This cannot be undone.'
      );
      if (ok) doReset();
      return;
    }
    Alert.alert(
      t('scores.resetTitle'),
      t('scores.resetMessage'),
      [
        { text: t('scores.cancel'), style: 'cancel' },
        { text: t('scores.reset'), style: 'destructive', onPress: doReset },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: Math.min(layout.contentMaxWidth, 560) }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>{backArrow}  Return</Text>
          </TouchableOpacity>
        </View>

        {/* Masthead */}
        <View style={styles.masthead}>
          <Text style={styles.eyebrow}>SECTION II  ·  RECORDS</Text>
          <View style={styles.doubleRule} />
          <Text style={styles.title}>The Registry of Duels</Text>
          <Text style={styles.subtitle}>An accounting of triumphs, defeats &amp; vanishings</Text>
          <View style={styles.singleRule} />
        </View>

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>OVERVIEW</Text>
          <View style={styles.overviewRow}>
            <BigStat label="Duels Played" value={stats.totalGames} />
            <View style={styles.vRule} />
            <BigStat label="Active Streak" value={stats.winStreak} accent={COLORS.playerX} />
            <View style={styles.vRule} />
            <BigStat label="Best Streak" value={stats.bestWinStreak} accent={COLORS.textBrass} />
          </View>
        </View>

        {/* AI Records */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>VS. THE SPECTRE</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.thOpponent]}>OPPONENT</Text>
            <Text style={[styles.thNum]}>W</Text>
            <Text style={[styles.thNum]}>L</Text>
            <Text style={[styles.thNum]}>D</Text>
            <Text style={[styles.thNum, styles.thLast]}>RATE</Text>
          </View>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const s = stats.ai[d];
            const total = s.wins + s.losses + s.draws;
            const rate = total > 0 ? Math.round((s.wins / total) * 100) : 0;
            return (
              <View key={d} style={styles.tableRow}>
                <View style={styles.tdOpponent}>
                  <Text style={styles.tdOpponentName}>{t(`home.${d}`)}</Text>
                  <Text style={styles.tdOpponentDesc}>{DIFF_DESCRIPTORS[d]}</Text>
                </View>
                <Text style={[styles.tdNum, styles.tdW]}>{s.wins}</Text>
                <Text style={[styles.tdNum, styles.tdL]}>{s.losses}</Text>
                <Text style={[styles.tdNum]}>{s.draws}</Text>
                <Text style={[styles.tdNum, styles.tdRate]}>{rate}%</Text>
              </View>
            );
          })}
        </View>

        {/* Friend Records */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>BETWIXT MORTALS</Text>
          <View style={styles.friendRow}>
            <View style={styles.friendCol}>
              <Text style={[styles.friendLabel, { color: COLORS.playerX }]}>Stamp X</Text>
              <Text style={[styles.friendValue, { color: COLORS.playerX }]}>{stats.friend.wins}</Text>
              <Text style={styles.friendCaption}>victories</Text>
            </View>
            <Text style={styles.vsItalic}>vs.</Text>
            <View style={styles.friendCol}>
              <Text style={[styles.friendLabel, { color: COLORS.playerO }]}>Stamp O</Text>
              <Text style={[styles.friendValue, { color: COLORS.playerO }]}>{stats.friend.losses}</Text>
              <Text style={styles.friendCaption}>victories</Text>
            </View>
            <Text style={styles.vsItalic}>·</Text>
            <View style={styles.friendCol}>
              <Text style={[styles.friendLabel, { color: COLORS.textMuted }]}>Draws</Text>
              <Text style={[styles.friendValue, { color: COLORS.textSecondary }]}>{stats.friend.draws}</Text>
              <Text style={styles.friendCaption}>unresolved</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={promptReset} activeOpacity={0.7}>
          <Text style={styles.resetOrnament}>✕</Text>
          <Text style={styles.resetText}>Strike the Record</Text>
          <Text style={styles.resetOrnament}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.resetCaption}>Cannot be undone. The ghosts will not remember.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BigStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={[styles.bigStatValue, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label.toUpperCase()}</Text>
    </View>
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
  backBtn: {
    paddingVertical: SPACING.xs,
  },
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
    backgroundColor: 'transparent',
  },
  sectionEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bigStat: {
    flex: 1,
    alignItems: 'center',
  },
  bigStatValue: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['3xl'] - 8,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: FONT_SIZES['3xl'] - 6,
  },
  bigStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textSecondary,
    letterSpacing: 1.4,
    marginTop: 4,
    textAlign: 'center',
  },
  vRule: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },

  // Table
  tableHead: {
    flexDirection: 'row',
    paddingBottom: SPACING.xs,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.rule,
    marginBottom: SPACING.xs,
  },
  thOpponent: {
    flex: 2,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textSecondary,
    letterSpacing: 1.4,
  },
  thNum: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textSecondary,
    letterSpacing: 1.4,
    textAlign: 'right',
  },
  thLast: {
    flex: 1.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.border,
  },
  tdOpponent: {
    flex: 2,
  },
  tdOpponentName: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  tdOpponentDesc: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  tdNum: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.textPrimary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  tdW: { color: COLORS.success },
  tdL: { color: COLORS.danger },
  tdRate: {
    flex: 1.2,
    color: COLORS.textBrass,
    fontFamily: FONTS.display,
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  friendCol: {
    alignItems: 'center',
    flex: 1,
  },
  friendLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  friendValue: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['2xl'],
    fontVariant: ['tabular-nums'],
    lineHeight: FONT_SIZES['2xl'],
  },
  friendCaption: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  vsItalic: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xs,
  },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.md,
  },
  resetOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    opacity: 0.7,
  },
  resetText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  resetCaption: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
