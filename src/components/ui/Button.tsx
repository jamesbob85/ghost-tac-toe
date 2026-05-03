import React from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  SPRING,
  BORDERS,
} from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; text: string; ornament: string }> = {
  primary: {
    bg: COLORS.playerX,
    border: COLORS.playerX,
    text: COLORS.background,
    ornament: COLORS.background,
  },
  secondary: {
    bg: COLORS.background,
    border: COLORS.rule,
    text: COLORS.textPrimary,
    ornament: COLORS.textBrass,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: COLORS.textBrass,
    ornament: COLORS.textBrass,
  },
  danger: {
    bg: COLORS.background,
    border: COLORS.danger,
    text: COLORS.danger,
    ornament: COLORS.danger,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const tapScale = useSharedValue(1);
  const tapOffset = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }, { translateY: tapOffset.value }],
  }));

  const handlePressIn = () => {
    tapScale.value = withTiming(0.98, { duration: 70 });
    tapOffset.value = withTiming(1, { duration: 70 });
  };

  const handlePressOut = () => {
    tapScale.value = withSpring(1, SPRING.snappy);
    tapOffset.value = withSpring(0, SPRING.snappy);
  };

  const v = VARIANT_STYLES[variant];

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'ghost' ? 0 : BORDERS.rule,
        },
        variant === 'ghost' && styles.ghostBase,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.inner}>
          <Text style={[styles.ornament, { color: v.ornament }]}>❦</Text>
          <Text style={[styles.text, { color: v.text }, textStyle]}>{label}</Text>
          <Text style={[styles.ornament, { color: v.ornament }]}>❦</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  ghostBase: {
    paddingVertical: SPACING.xs,
    minHeight: 36,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  text: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ornament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.sm,
    opacity: 0.7,
  },
});
