import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, StyleSheet } from 'react-native';
import * as Localization from 'expo-localization';
import { COLORS } from '../src/constants/theme';

// Initialize i18n (side-effect import)
import '../src/i18n';

// RTL support: detect device text direction and configure
const locales = Localization.getLocales();
const isRTL = locales[0]?.textDirection === 'rtl';
if (I18nManager.isRTL !== isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'slide_from_right',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
