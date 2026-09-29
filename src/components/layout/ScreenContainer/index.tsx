import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  View, 
  ViewStyle, 
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import BottomNav from '../BottomNav';

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  withPadding?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
  maxContentWidth?: number;
};

export default function ScreenContainer({
  children,
  scroll = false,
  withPadding = true,
  style,
  maxContentWidth = 960,
  backgroundColor = colors.background, // Pure Black
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    { backgroundColor },
    style
  ];

  const contentStyle = [
    styles.content,
    { maxWidth: maxContentWidth, alignSelf: 'center' as const },
    withPadding && styles.padding,
    !scroll && { flex: 1 }
  ];

  return (
    <View style={containerStyle}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      >
        {scroll ? (
          <ScrollView 
            contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + spacing.xl }]} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingTop: insets.top + spacing.sm }}>
              {children}
            </View>
          </ScrollView>
        ) : (
          <View style={[contentStyle, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom }]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
  },
  padding: {
    paddingHorizontal: spacing.md,
  }
});
