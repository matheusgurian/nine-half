import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../ScreenContainer';
import { colors } from '../../../theme/colors';

type Props = { children: React.ReactNode; mode: 'login' | 'register'; onBack?: () => void };

export default function AuthLayout({ children, mode, onBack }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const registering = mode === 'register';
  return (
    <ScreenContainer scroll maxContentWidth={1200}>
      <View style={styles.masthead}>
        <View style={styles.brand}><Text style={styles.mark}>9½</Text><Text style={styles.wordmark}>NINE HALF</Text></View>
        {onBack ? <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={17} color={colors.textSecondary} /><Text style={styles.backText}>Voltar ao login</Text></Pressable> : <Text style={styles.edition}>ESTOQUE E VENDAS</Text>}
      </View>
      <View style={[styles.layout, wide && styles.layoutWide]}>
        <View style={[styles.story, wide && styles.storyWide]}>
          <View style={styles.storyTop}><Text style={styles.kicker}>PLATAFORMA DE GESTÃO</Text><Ionicons name="arrow-forward" style={{ transform: [{ rotate: '-45deg' }] }} size={24} color={colors.primary} /></View>
          <Text accessibilityRole="header" style={[styles.headline, wide && styles.headlineWide]}>Estoque e vendas.{'\n'}Gestão integrada.</Text>
          <Text style={styles.storyText}>Centralize produtos, reservas e negociações em um único ambiente.</Text>
          {wide && <View accessible={false} style={styles.art}><View style={styles.artLine} /><Text style={styles.artMark}>9½</Text><View style={styles.artTag}><Text style={styles.artTagText}>NINE HALF / GESTÃO</Text></View></View>}
          <View style={styles.storyFooter}><Text style={styles.footerLabel}>ESTOQUE</Text><Text style={styles.footerLabel}>RESERVAS</Text><Text style={styles.footerLabel}>VENDAS</Text></View>
        </View>
        <View style={[styles.formSide, wide && styles.formSideWide]}>
          <View style={styles.intro}><View style={styles.accentLine} /><Text style={styles.sectionLabel}>{registering ? 'CADASTRO' : 'ACESSO À CONTA'}</Text><Text accessibilityRole="header" style={styles.title}>{registering ? 'Criar conta' : 'Acessar plataforma'}</Text><Text style={styles.description}>{registering ? 'Preencha seus dados para cadastrar sua conta.' : 'Informe suas credenciais para acessar sua conta.'}</Text></View>
          {children}
        </View>
      </View>
      <View style={styles.bottom}><Text style={styles.bottomText}>NINE HALF</Text><Text style={styles.bottomText}>Gestão de estoque e vendas.</Text></View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 22, flexWrap: 'wrap' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { fontSize: 22, fontWeight: '900', backgroundColor: colors.primary, color: '#151613', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: 1, color: colors.white },
  edition: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.textCaption },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { color: colors.textSecondary, fontSize: 13 },
  layout: { gap: 24 },
  layoutWide: { flexDirection: 'row', alignItems: 'stretch', gap: 0, borderWidth: 1, borderColor: colors.border, borderRadius: 24, overflow: 'hidden' },
  story: { backgroundColor: colors.backgroundSecondary, padding: 24, borderRadius: 20, overflow: 'hidden' },
  storyWide: { flex: 1.1, borderRadius: 0, padding: 36, minHeight: 640 },
  storyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  kicker: { flex: 1, fontSize: 10, lineHeight: 16, fontWeight: '800', letterSpacing: 1.5, color: colors.textSecondary },
  headline: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7, color: colors.textPrimary, marginTop: 22 },
  headlineWide: { fontSize: 38, lineHeight: 46, marginTop: 34 },
  storyText: { fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 14, maxWidth: 290 },
  art: { flex: 1, minHeight: 210, alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
  artLine: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: colors.border, transform: [{ rotate: '-18deg' }, { scaleX: 1.2 }] },
  artMark: { fontSize: 132, lineHeight: 150, fontWeight: '900', letterSpacing: -10, color: colors.border, transform: [{ rotate: '-10deg' }] },
  artTag: { backgroundColor: colors.primary, paddingHorizontal: 15, paddingVertical: 10, transform: [{ rotate: '-5deg' }], marginTop: -10 },
  artTagText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#20221F' },
  storyFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 22 },
  footerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: colors.textSecondary },
  formSide: { paddingHorizontal: 8, paddingVertical: 12 },
  formSideWide: { flex: 1, padding: 40, justifyContent: 'center', backgroundColor: colors.surface },
  intro: { marginBottom: 28 },
  accentLine: { width: 32, height: 3, backgroundColor: colors.primary, marginBottom: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontWeight: '800', color: colors.white },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 10 },
  bottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingVertical: 24 },
  bottomText: { color: colors.textCaption, fontSize: 11, letterSpacing: 0.5 }
});
