import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDERS,
} from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { useLayout } from '../src/hooks/useLayout';
import { getTodaysGhost } from '../src/daily/ghosts';

const ISSUE_DATE = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export default function HomeScreen() {
  const router = useRouter();
  const layout = useLayout();
  const ghost = getTodaysGhost();

  const contentWidth = Math.min(layout.contentMaxWidth, 560);

  const ghostY = useSharedValue(0);
  const ghostRot = useSharedValue(0);
  useEffect(() => {
    ghostY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1700 }),
        withTiming(0, { duration: 1700 }),
      ),
      -1,
      true,
    );
    ghostRot.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2200 }),
        withTiming(3, { duration: 2200 }),
      ),
      -1,
      true,
    );
  }, []);

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ghostY.value }, { rotate: `${ghostRot.value}deg` }],
  }));

  const handlePlay = () => {
    router.push({
      pathname: '/game',
      params: { ghost: ghost.id, modifiers: 'ghost_eviction' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: contentWidth }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── MASTHEAD ─────────────────────────────────────── */}
        <View style={styles.masthead}>
          <View style={styles.dateLine}>
            <Text style={styles.dateLineText}>VOL. I  ·  №1  ·  EST. MMXXVI</Text>
            <Text style={styles.dateLineText}>{ISSUE_DATE.toUpperCase()}</Text>
          </View>

          <View style={styles.doubleRule} />
          <View style={styles.singleRule} />

          <Animated.Text style={[styles.ghostMark, ghostStyle]}>👻</Animated.Text>

          <Text style={styles.titleSmall}>The</Text>
          <Text style={styles.titleHuge}>GHOST TIMES</Text>
          <Text style={styles.titleSubtitle}>Reports from the Three-Mark Parlour</Text>

          <View style={styles.singleRule} />
          <View style={styles.doubleRule} />
        </View>

        {/* ─── TODAY'S HAUNTING ─────────────────────────────── */}
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowRule} />
          <Text style={styles.eyebrow}>TODAY’S HAUNTING</Text>
          <View style={styles.eyebrowRule} />
        </View>

        <View style={styles.ghostCard}>
          <Text style={styles.ghostName}>{ghost.name}</Text>
          <Text style={styles.ghostEpithet}>“{ghost.epithet}”</Text>
          <Text style={styles.ornament}>❦</Text>
          <Text style={styles.ghostFlavor}>{ghost.flavor}</Text>
        </View>

        {/* ─── BEGIN ────────────────────────────────────────── */}
        <View style={styles.playSection}>
          <Button
            label="Begin the Séance"
            onPress={handlePlay}
            variant="primary"
            fullWidth
          />
          <Text style={styles.playCaption}>
            One match. Banish the ghost or be banished.
          </Text>
        </View>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.singleRule} />
          <View style={styles.footerRow}>
            <FooterLink
              ornament="✪"
              label="Registry"
              caption="Past hauntings"
              onPress={() => router.push('/scores')}
            />
            <Text style={styles.footerDivider}>·</Text>
            <FooterLink
              ornament="⚙"
              label="Provisions"
              caption="Audio & language"
              onPress={() => router.push('/settings')}
            />
          </View>
          <Text style={styles.colophon}>
            ❦  An honest publication printed in the year of our discontent  ❦
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FooterLink({
  ornament,
  label,
  caption,
  onPress,
}: {
  ornament: string;
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.footerLink} activeOpacity={0.65}>
      <Text style={styles.footerOrnament}>{ornament}</Text>
      <Text style={styles.footerLinkLabel}>{label}</Text>
      <Text style={styles.footerLinkCaption}>{caption}</Text>
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

  // Masthead
  masthead: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  dateLineText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textSecondary,
    letterSpacing: 1.6,
  },
  doubleRule: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.rule,
  },
  singleRule: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.rule,
    marginTop: 3,
    marginBottom: 3,
  },
  ghostMark: {
    fontSize: 56,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  titleSmall: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    marginBottom: -8,
  },
  titleHuge: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['3xl'] + 4,
    lineHeight: FONT_SIZES['3xl'] + 6,
    letterSpacing: -1.5,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  titleSubtitle: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },

  // Eyebrow
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm + 2,
  },
  eyebrowRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.rule,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },

  // Ghost card
  ghostCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.rule,
    marginBottom: SPACING.lg,
  },
  ghostName: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: FONT_SIZES['2xl'] * 1.1,
  },
  ghostEpithet: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.playerO,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  ornament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
    marginVertical: SPACING.sm,
  },
  ghostFlavor: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.55,
    color: COLORS.textPrimary,
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
  },

  // Play
  playSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  playCaption: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  footerDivider: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  footerLink: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  footerOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
    marginBottom: 2,
  },
  footerLinkLabel: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  footerLinkCaption: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  colophon: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});
