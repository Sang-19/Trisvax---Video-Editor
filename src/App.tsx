import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { openVideoEditor, VideoEditorHost } from '@zlucksolutions/react-native-video-editor';

type MediaKind = 'video' | 'photo';
type Screen = 'home' | 'picker' | 'preview';
type Asset = { uri: string; name?: string | null; type?: string | null; size?: number | null };

const C = {
  bg: '#0B0807',
  card: '#18110D',
  card2: '#221711',
  accent: '#FF5500',
  accentSoft: '#FF8232',
  text: '#FFFFFF',
  secondary: '#9AA69B',
  muted: '#667568',
  border: '#2B352D',
  blue: '#82B8FF',
  danger: '#FF5A5A',
};

function ActionButton({ label, onPress, secondary = false, disabled = false }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, secondary && styles.actionButtonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function BrandHeader({ onBack, rightLabel }: { onBack?: () => void; rightLabel?: string }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>T</Text></View>
      )}
      <View style={styles.brandCopy}>
        <Text style={styles.brandName}>TRISVAX</Text>
        <Text style={styles.brandSub}>VIDEO STUDIO</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.statusDot} />
        <Text style={styles.headerRightText}>{rightLabel || 'STUDIO'}</Text>
      </View>
    </View>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  const [kind, setKind] = useState<MediaKind>('video');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const openPicker = useCallback(async (mediaKind: MediaKind, append = false) => {
    setKind(mediaKind);
    if (!append) {
      setAssets([]);
      setActiveIndex(0);
      setScreen('picker');
    }
    try {
      setBusy(true);
      const result = await pick({
        type: [mediaKind === 'video' ? types.video : types.images],
        mode: 'open',
        allowMultiSelection: true,
      });
      const chosen = (result || []).filter(item => Boolean(item.uri)).map(item => ({
        uri: item.uri,
        name: item.name,
        type: item.type,
        size: item.size,
      }));
      if (chosen.length) {
        setAssets(current => append ? [...current, ...chosen] : chosen);
        if (!append) setActiveIndex(0);
        setScreen('preview');
      }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Could not open media', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const launchEditor = useCallback(async (asset: Asset) => {
    if (kind === 'photo') {
      Alert.alert(
        'Photo workspace',
        'The installed native SDK (1.0.7) is a video editor and does not expose photo-editing APIs yet. Your photo is selected, but photo editing is not enabled.',
      );
      return;
    }
    try {
      setBusy(true);
      const result = await openVideoEditor({
        source: asset.uri,
        editTrim: true,
        editCrop: true,
        editBGM: true,
        editTextOverlay: true,
        editVoiceOver: true,
        isGesture: true,
      });
      if (result.success && result.exportedUri) {
        Alert.alert('Export complete', 'Your edited video is ready:\\n' + result.exportedUri);
      } else if (result.error) {
        Alert.alert('Editor closed', result.error);
      }
    } catch (error) {
      Alert.alert('Could not open editor', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }, [kind]);

  const removeAsset = (index: number) => {
    setAssets(current => current.filter((_, i) => i !== index));
    setActiveIndex(current => {
      if (index < current) return current - 1;
      if (index === current) return Math.max(0, current - 1);
      return current;
    });
  };

  const moveAsset = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= assets.length) return;
    setAssets(current => {
      const next = [...current];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setActiveIndex(target);
  };

  const goHome = () => {
    setAssets([]);
    setActiveIndex(0);
    setScreen('home');
  };

  const activeAsset = assets[activeIndex];

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: Math.max(insets.top, 0) }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {screen === 'home' && (
        <>
          <BrandHeader />
          <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.heroEyebrow}>
              <View style={styles.heroEyebrowLine} />
              <Text style={styles.eyebrowText}>CREATE WITHOUT LIMITS</Text>
            </View>
            <Text style={styles.heroTitle}>Your story.{'\n'}<Text style={styles.heroAccent}>Your cut.</Text></Text>
            <Text style={styles.heroDescription}>
              A focused editing space for the moments worth keeping. Choose your media and start creating.
            </Text>

            <View style={styles.featureCard}>
              <View style={styles.featureCardTop}>
                <Text style={styles.featureOverline}>TRISVAX ORIGINALS</Text>
                <Text style={styles.featureNumber}>01 / 02</Text>
              </View>
              <View style={styles.featureArtwork}>
                <View style={styles.artCircleOuter}>
                  <View style={styles.artCircleInner}>
                    <Text style={styles.artPlay}>▶</Text>
                  </View>
                </View>
                <View style={styles.artSideText}>
                  <Text style={styles.artSideSmall}>MAKE EVERY</Text>
                  <Text style={styles.artSideLarge}>FRAME</Text>
                  <Text style={styles.artSideLarge}>MATTER.</Text>
                </View>
              </View>
              <View style={styles.featureCardBottom}>
                <Text style={styles.featureOverline}>CAPTURE  /  CREATE  /  SHARE</Text>
                <View style={styles.featureArrow}><Text style={styles.featureArrowText}>↗</Text></View>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Choose your workspace</Text>
              <Text style={styles.sectionMeta}>SELECT MEDIA</Text>
            </View>

            <Pressable onPress={() => openPicker('video')} style={({ pressed }) => [styles.workspaceCard, pressed && styles.pressed]}>
              <View style={styles.workspaceIconVideo}><Text style={styles.workspaceIconText}>▶</Text></View>
              <View style={styles.workspaceCopy}>
                <Text style={styles.workspaceTitle}>Video studio</Text>
                <Text style={styles.workspaceDescription}>Trim · Crop · Music · Text · Voice-over</Text>
              </View>
              <Text style={styles.workspaceArrow}>↗</Text>
            </Pressable>

            <Pressable onPress={() => openPicker('photo')} style={({ pressed }) => [styles.workspaceCard, pressed && styles.pressed]}>
              <View style={styles.workspaceIconPhoto}><Text style={styles.workspaceIconText}>▧</Text></View>
              <View style={styles.workspaceCopy}>
                <Text style={styles.workspaceTitle}>Photo workspace</Text>
                <Text style={styles.workspaceDescription}>Select and preview photos</Text>
              </View>
              <Text style={styles.workspaceArrow}>↗</Text>
            </Pressable>

            <View style={styles.privacyRow}>
              <Text style={styles.privacyIcon}>◈</Text>
              <Text style={styles.privacyText}>Your media stays on your device. No account or cloud upload.</Text>
            </View>
          </ScrollView>
        </>
      )}

      {screen === 'picker' && (
        <>
          <BrandHeader onBack={goHome} rightLabel="MEDIA" />
          <View style={styles.centerState}>
            {busy ? <ActivityIndicator size="large" color={C.accent} /> : <Text style={styles.emptyIcon}>▧</Text>}
            <Text style={styles.centerTitle}>{busy ? 'Opening your library' : 'Choose from your device'}</Text>
            <Text style={styles.centerDescription}>
              {busy ? 'Select one or more files in the Android picker.' : 'Use the button below to open the Android media picker.'}
            </Text>
            {!busy && <ActionButton label={'OPEN ' + kind.toUpperCase() + ' PICKER'} onPress={() => openPicker(kind, true)} />}
            <Text style={styles.centerFootnote}>MULTI-SELECTION ENABLED</Text>
          </View>
        </>
      )}

      {screen === 'preview' && (
        <>
          <BrandHeader onBack={() => setScreen('home')} rightLabel="PREVIEW" />
          <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.previewHeadingRow}>
              <View>
                <Text style={styles.eyebrowText}>STEP 02  /  YOUR MEDIA</Text>
                <Text style={styles.previewTitle}>Review your{'\n'}<Text style={styles.heroAccent}>selection.</Text></Text>
              </View>
              <View style={styles.countPill}><Text style={styles.countText}>{assets.length} SELECTED</Text></View>
            </View>

            {activeAsset && (
              <View style={styles.mainPreview}>
                {kind === 'photo' ? (
                  <Image source={{ uri: activeAsset.uri }} style={styles.mainPreviewImage} resizeMode="contain" />
                ) : (
                  <View style={styles.videoPreviewPlaceholder}>
                    <View style={styles.previewPlayCircle}><Text style={styles.previewPlayText}>▶</Text></View>
                    <Text style={styles.videoPreviewLabel}>VIDEO SELECTED</Text>
                  </View>
                )}
                <View style={styles.mainPreviewFooter}>
                  <Text style={styles.mainPreviewName} numberOfLines={1}>{activeAsset.name || (kind === 'video' ? 'Selected video' : 'Selected photo')}</Text>
                  <Text style={styles.mainPreviewMeta}>{activeAsset.type || kind.toUpperCase()}{activeAsset.size ? '  ·  ' + (activeAsset.size / 1048576).toFixed(1) + ' MB' : ''}</Text>
                </View>
              </View>
            )}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Selected files</Text>
              <Text style={styles.sectionMeta}>TAP TO PREVIEW</Text>
            </View>

            {assets.map((item, index) => (
              <Pressable key={item.uri + index} onPress={() => setActiveIndex(index)} style={[styles.assetRow, activeIndex === index && styles.assetRowActive]}>
                <View style={styles.assetIndex}><Text style={styles.assetIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName} numberOfLines={1}>{item.name || (kind === 'video' ? 'Video file' : 'Photo file')}</Text>
                  <Text style={styles.assetSub}>{item.type || kind.toUpperCase()}{item.size ? ' · ' + (item.size / 1048576).toFixed(1) + ' MB' : ''}</Text>
                </View>
                <View style={styles.assetActions}>
                  <Pressable hitSlop={8} onPress={() => moveAsset(index, -1)} style={styles.miniAction}><Text style={styles.miniActionText}>↑</Text></Pressable>
                  <Pressable hitSlop={8} onPress={() => moveAsset(index, 1)} style={styles.miniAction}><Text style={styles.miniActionText}>↓</Text></Pressable>
                  <Pressable hitSlop={8} onPress={() => removeAsset(index)} style={styles.miniAction}><Text style={styles.removeActionText}>×</Text></Pressable>
                </View>
              </Pressable>
            ))}

            <ActionButton label="ADD MORE MEDIA" secondary onPress={() => openPicker(kind)} />
            {kind === 'video' && assets.length > 1 && (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Multiple clips selected</Text>
                <Text style={styles.noticeText}>
                  The installed SDK 1.0.7 accepts one source video per editing session. You can open each clip individually; combining clips into one timeline needs additional editing-engine support.
                </Text>
              </View>
            )}
            {kind === 'photo' && (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Photo preview</Text>
                <Text style={styles.noticeText}>
                  The installed SDK provides video editing, not photo-editing APIs. Photo editing and export are not presented as working features yet.
                </Text>
              </View>
            )}
            {activeAsset && (
              <ActionButton
                label={kind === 'video' ? 'EDIT THIS VIDEO  →' : 'PHOTO SELECTED'}
                onPress={() => launchEditor(activeAsset)}
                disabled={busy || kind === 'photo'}
              />
            )}
            <Text style={[styles.centerFootnote, { marginTop: 18, marginBottom: 12 }]}>LOCAL MEDIA  ·  PRIVATE BY DESIGN</Text>
          </ScrollView>
        </>
      )}

      {busy && screen !== 'picker' && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={styles.busyText}>Opening editor…</Text>
        </View>
      )}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Text style={styles.bottomBarText}>TRISVAX  /  VIDEO STUDIO</Text>
        <View style={styles.bottomBarStatus}><View style={styles.statusDot} /><Text style={styles.bottomBarStatusText}>LOCAL SESSION</Text></View>
      </View>
      <VideoEditorHost />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider><AppContent /></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, backgroundColor: C.bg },
  header: { minHeight: 64, paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#211811' },
  brandMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.text, fontSize: 21, fontWeight: '900' },
  brandCopy: { marginLeft: 10, flex: 1 },
  brandName: { color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 2.4 },
  brandSub: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  headerRightText: { color: C.secondary, fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  statusDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: C.accent },
  backButton: { width: 34, height: 34, alignItems: 'flex-start', justifyContent: 'center' },
  backText: { color: C.text, fontSize: 34, lineHeight: 36 },
  homeScroll: { paddingHorizontal: 22, paddingTop: 25, paddingBottom: 28 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroEyebrowLine: { width: 22, height: 2, backgroundColor: C.accent },
  eyebrowText: { color: C.accentSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1.9 },
  heroTitle: { color: C.text, fontSize: 51, lineHeight: 54, fontWeight: '900', letterSpacing: -2, marginTop: 18 },
  heroAccent: { color: C.accent },
  heroDescription: { color: C.secondary, fontSize: 13, lineHeight: 21, marginTop: 12, maxWidth: 310 },
  featureCard: { height: 224, backgroundColor: C.card2, borderRadius: 17, borderWidth: 1, borderColor: '#3A2418', padding: 15, marginTop: 25, overflow: 'hidden' },
  featureCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  featureOverline: { color: '#B58A70', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  featureNumber: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  featureArtwork: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  artCircleOuter: { width: 126, height: 126, borderRadius: 70, borderWidth: 1, borderColor: '#A34A21', alignItems: 'center', justifyContent: 'center' },
  artCircleInner: { width: 91, height: 91, borderRadius: 50, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  artPlay: { color: C.text, fontSize: 27, marginLeft: 4 },
  artSideText: { marginLeft: 16 },
  artSideSmall: { color: C.secondary, fontSize: 8, letterSpacing: 1.7, fontWeight: '800' },
  artSideLarge: { color: C.text, fontSize: 18, lineHeight: 21, fontWeight: '900', letterSpacing: 1.1 },
  featureCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureArrow: { width: 25, height: 25, borderRadius: 8, backgroundColor: '#3A2115', alignItems: 'center', justifyContent: 'center' },
  featureArrowText: { color: C.accentSoft, fontSize: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  sectionMeta: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  workspaceCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 13, marginBottom: 10 },
  workspaceIconVideo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#3B1D10', alignItems: 'center', justifyContent: 'center' },
  workspaceIconPhoto: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1C2A32', alignItems: 'center', justifyContent: 'center' },
  workspaceIconText: { color: C.accentSoft, fontSize: 21, fontWeight: '900' },
  workspaceCopy: { flex: 1, marginLeft: 13 },
  workspaceTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  workspaceDescription: { color: C.secondary, fontSize: 10, marginTop: 5 },
  workspaceArrow: { color: C.accent, fontSize: 20, paddingHorizontal: 5 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12, paddingHorizontal: 3 },
  privacyIcon: { color: C.accentSoft, fontSize: 15 },
  privacyText: { color: C.muted, fontSize: 9, flex: 1, lineHeight: 14 },
  centerState: { flex: 1, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { color: C.accent, fontSize: 45 },
  centerTitle: { color: C.text, fontSize: 21, fontWeight: '900', marginTop: 18 },
  centerDescription: { color: C.secondary, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  centerFootnote: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 18 },
  actionButton: { minHeight: 51, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 9 },
  actionButtonSecondary: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  actionButtonText: { color: C.text, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  actionButtonTextSecondary: { color: C.secondary },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  previewScroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  previewHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  previewTitle: { color: C.text, fontSize: 34, lineHeight: 37, fontWeight: '900', letterSpacing: -1.2, marginTop: 10 },
  countPill: { borderWidth: 1, borderColor: '#71351D', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 4 },
  countText: { color: C.accentSoft, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  mainPreview: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, overflow: 'hidden', marginTop: 20 },
  mainPreviewImage: { width: '100%', height: 220, backgroundColor: '#100D0B' },
  videoPreviewPlaceholder: { height: 180, backgroundColor: '#21150F', alignItems: 'center', justifyContent: 'center' },
  previewPlayCircle: { width: 56, height: 56, borderRadius: 30, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  previewPlayText: { color: C.text, fontSize: 19, marginLeft: 3 },
  videoPreviewLabel: { color: C.secondary, fontSize: 8, fontWeight: '900', letterSpacing: 1.8, marginTop: 13 },
  mainPreviewFooter: { paddingHorizontal: 13, paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.border },
  mainPreviewName: { color: C.text, fontSize: 12, fontWeight: '800' },
  mainPreviewMeta: { color: C.muted, fontSize: 9, marginTop: 4 },
  assetRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 10, marginBottom: 8 },
  assetRowActive: { borderColor: C.accent, backgroundColor: '#24160F' },
  assetIndex: { width: 31, height: 31, borderRadius: 9, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  assetIndexText: { color: C.accentSoft, fontSize: 9, fontWeight: '900' },
  assetInfo: { flex: 1, marginLeft: 10 },
  assetName: { color: C.text, fontSize: 11, fontWeight: '800' },
  assetSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  assetActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniAction: { width: 26, height: 28, alignItems: 'center', justifyContent: 'center' },
  miniActionText: { color: C.secondary, fontSize: 15, fontWeight: '700' },
  removeActionText: { color: C.danger, fontSize: 19, fontWeight: '500' },
  noticeCard: { backgroundColor: '#21170F', borderWidth: 1, borderColor: '#55301D', borderRadius: 12, padding: 13, marginTop: 13 },
  noticeTitle: { color: C.accentSoft, fontSize: 11, fontWeight: '900' },
  noticeText: { color: C.secondary, fontSize: 10, lineHeight: 16, marginTop: 6 },
  busyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,8,7,0.82)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  busyText: { color: C.text, fontSize: 11, marginTop: 12 },
  bottomBar: { minHeight: 34, borderTopWidth: 1, borderTopColor: '#211811', paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomBarText: { color: C.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  bottomBarStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomBarStatusText: { color: C.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1 },
});
