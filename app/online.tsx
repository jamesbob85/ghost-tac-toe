import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES, RADIUS, SPACING, glowShadow } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { useGPGS } from '../src/hooks/useGPGS';
import { getTierInfo, formatTierDisplay } from '../src/services/rankCalculator';
import { upsertPlayer, getPlayer } from '../src/services/playerService';
import { STARTING_RATING } from '../src/constants/ranks';
import { PlayerProfile } from '../src/types/online';

export default function OnlineHubScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '\u2192' : '\u2190';
  const gpgs = useGPGS();

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // When GPGS signs in, upsert player in Supabase
  useEffect(() => {
    if (!gpgs.isSignedIn || !gpgs.player) return;

    setLoading(true);
    upsertPlayer(gpgs.player.playerId, gpgs.player.displayName)
      .then((p) => setPlayer(p))
      .catch(() => {
        // If upsert fails, try fetching existing
        return getPlayer(gpgs.player!.playerId).then((p) => {
          if (p) setPlayer(p);
        });
      })
      .finally(() => setLoading(false));
  }, [gpgs.isSignedIn, gpgs.player?.playerId]);

  const handleRankedMatch = useCallback(() => {
    if (!player) return;
    router.push({
      pathname: '/matchmaking',
      params: {
        playerId: player.id,
        rating: String(player.rating),
        winStreak: String(player.win_streak),
        placementRemaining: String(player.placement_remaining),
      },
    });
  }, [player, router]);

  const handleLeaderboard = useCallback(() => {
    router.push({
      pathname: '/leaderboard',
      params: { playerId: gpgs.player?.playerId ?? '' },
    });
  }, [gpgs.player, router]);

  const handleProfile = useCallback(() => {
    if (!gpgs.player) return;
    router.push({
      pathname: '/profile',
      params: { playerId: gpgs.player.playerId },
    });
  }, [gpgs.player, router]);

  const rating = player?.rating ?? STARTING_RATING;
  const tierInfo = getTierInfo(rating);

  // ─── Loading GPGS ─────────────────────────────────────────────────
  if (gpgs.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color={COLORS.textSecondary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Signed-out view ──────────────────────────────────────────────
  if (!gpgs.isSignedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.container, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{backArrow} {t('game.back')}</Text>
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.signInContainer}>
            <Text style={styles.signInIcon}>👻</Text>
            <Text style={styles.signInTitle}>{t('online.signInTitle')}</Text>
            <Text style={styles.signInSubtitle}>{t('online.signInSubtitle')}</Text>

            <TouchableOpacity style={styles.signInBtn} onPress={gpgs.signIn}>
              <Text style={styles.signInBtnText}>{t('online.signInButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Signed-in view ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.container, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{backArrow} {t('game.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('online.title')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.textSecondary} size="large" />
          </View>
        ) : (
          <>
            {/* Tier Badge */}
            <View style={[styles.tierBadge, { borderColor: tierInfo.tier.color }, glowShadow(tierInfo.tier.color, 0.4)]}>
              <Text style={styles.tierIcon}>{tierInfo.tier.icon}</Text>
              <Text style={[styles.tierName, { color: tierInfo.tier.color }]}>{tierInfo.displayName}</Text>
              <Text style={styles.tierRating}>{rating} SR</Text>
              {player && player.placement_remaining > 0 && (
                <Text style={styles.placementText}>
                  {player.placement_remaining} {t('online.placement').toLowerCase()}
                </Text>
              )}
            </View>

            {/* Player Name */}
            <Text style={styles.playerName}>{player?.display_name ?? gpgs.player?.displayName ?? 'Player'}</Text>

            {/* Ranked Match Button */}
            <TouchableOpacity
              style={[styles.rankedBtn, { backgroundColor: tierInfo.tier.colorDim, borderColor: tierInfo.tier.color }]}
              onPress={handleRankedMatch}
            >
              <Text style={[styles.rankedBtnText, { color: tierInfo.tier.color }]}>
                ⚔️ {t('online.rankedMatch')}
              </Text>
            </TouchableOpacity>

            {/* Achievements Button */}
            <TouchableOpacity style={styles.achievementsBtn} onPress={gpgs.showAchievements}>
              <Text style={styles.achievementsBtnText}>🏆 {t('settings.about') === 'About' ? 'Achievements' : t('settings.about')}</Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerLink} onPress={handleLeaderboard}>
                <Text style={styles.footerLinkText}>🏆 {t('online.leaderboard')}</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity style={styles.footerLink} onPress={handleProfile}>
                <Text style={styles.footerLinkText}>👤 {t('online.profile')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs, width: 60 },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  // Sign-in
  signInContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: SPACING['2xl'] },
  signInIcon: { fontSize: 72 },
  signInTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', color: COLORS.textPrimary, marginTop: SPACING.md },
  signInSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xl },
  signInBtn: {
    backgroundColor: COLORS.playerX,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  signInBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.white },

  // Tier badge
  tierBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  tierIcon: { fontSize: 64 },
  tierName: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', marginTop: SPACING.sm },
  tierRating: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '700', marginTop: SPACING.xs },
  placementText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: '600', marginTop: SPACING.sm },

  playerName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },

  // Ranked button
  rankedBtn: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  rankedBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '800' },

  // Achievements
  achievementsBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  achievementsBtnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto' as any,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  footerLink: { padding: SPACING.sm },
  footerLinkText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  footerDivider: { width: 1, height: 16, backgroundColor: COLORS.border },
});
