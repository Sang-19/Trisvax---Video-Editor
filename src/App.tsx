import React, { useCallback, useState } from 'react';
import {
  Alert, Image, Pressable, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { openVideoEditor, VideoEditorHost } from '@zlucksolutions/react-native-video-editor';

type MediaKind = 'video' | 'photo';
type Screen = 'home' | 'select' | 'photo-editor';
type Asset = { uri: string; name?: string | null; type?: string | null; size?: number | null };

const C = {
  bg: '#0B0D0B', panel: '#151915', panel2: '#1D231D', line: '#293129',
  lime: '#C9F36A', white: '#F4F6EF', muted: '#929B8D', dim: '#667064',
  orange: '#F6A66B',
};

function Button({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary,
        disabled && { opacity: 0.45 }, pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] }]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </Pressable>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  const [kind, setKind] = useState<MediaKind>('video');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Adjust');

  const chooseMedia = useCallback(async (mediaKind: MediaKind) => {
    setKind(mediaKind);
    try {
      setBusy(true);
      const result = await pick({
        type: [mediaKind === 'video' ? types.video : types.images],
        mode: 'open',
        allowMultiSelection: false,
      });
      const selected = result?.[0];
      if (selected?.uri) {
        setAsset({ uri: selected.uri, name: selected.name, type: selected.type, size: selected.size });
      }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Unable to select media', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const startEditing = useCallback(async () => {
    if (!asset) return;
    if (kind === 'photo') {
      setScreen('photo-editor');
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
        Alert.alert('Export complete', 'Your edited video is ready:\n' + result.exportedUri);
      } else if (result.error) {
        Alert.alert('Editor closed', result.error);
      }
    } catch (error) {
      Alert.alert('Could not open editor', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }, [asset, kind]);

  const reset = () => {
    setAsset(null);
    setScreen('select');
  };

  const topBar = (back = false) => (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
      {back ? <Pressable onPress={() => setScreen(screen === 'photo-editor' ? 'select' : 'home')}><Text style={styles.back}>‹</Text></Pressable>
        : <View style={styles.logoMark}><Text style={styles.logoMarkText}>T</Text></View>}
      <Text style={styles.brand}>TRISVAX <Text style={styles.brandThin}>STUDIO</Text></Text>
      <View style={styles.topTag}><View style={styles.dot} /><Text style={styles.topTagText}>BETA</Text></View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {screen === 'home' && <>
        {topBar()}
        <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.eyebrow}><Text style={styles.eyebrowText}>YOUR CREATIVE SPACE</Text></View>
          <Text style={styles.hero}>Make it{ '\n' }<Text style={styles.heroAccent}>move.</Text></Text>
          <Text style={styles.subhead}>A simple studio for your moments. Pick a clip, shape the story, make it yours.</Text>
          <View style={styles.artCard}>
            <View style={styles.artTop}><Text style={styles.artLabel}>CREATE / 001</Text><Text style={styles.artLabel}>TRISVAX EDITION</Text></View>
            <View style={styles.artVisual}>
              <View style={styles.artRing}><View style={styles.artInner}><Text style={styles.playIcon}>▶</Text></View></View>
              <View style={styles.artCaption}><Text style={styles.artCaptionSmall}>EVERY FRAME</Text><Text style={styles.artCaptionBig}>HAS A FEELING.</Text></View>
            </View>
            <View style={styles.artBottom}><Text style={styles.artLabel}>VIDEO · PHOTO · STORY</Text><Text style={styles.artArrow}>↗</Text></View>
          </View>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Start creating</Text><Text style={styles.sectionHint}>01 — 02</Text></View>
          <Button title="Open your studio   →" onPress={() => { setAsset(null); setScreen('select'); }} />
          <Text style={styles.footnote}>No account. No uploads. Your media stays on your device.</Text>
        </ScrollView>
      </>}

      {screen === 'select' && <>
        {topBar(true)}
        <ScrollView contentContainerStyle={styles.selectContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.step}>STEP 01 / MEDIA</Text>
          <Text style={styles.pageTitle}>Choose your{ '\n' }<Text style={styles.heroAccent}>素材.</Text></Text>
          <Text style={styles.subhead}>Select a video or photo from your device. Your gallery opens only when you choose a media type.</Text>
          <View style={styles.mediaOptions}>
            <Pressable onPress={() => chooseMedia('video')} style={styles.mediaCard}>
              <View style={styles.mediaIcon}><Text style={styles.mediaEmoji}>▶</Text></View>
              <View style={styles.mediaText}><Text style={styles.mediaTitle}>Video</Text><Text style={styles.mediaDesc}>Trim · Crop · Music · Text · Voice</Text></View>
              <Text style={styles.chevron}>↗</Text>
            </Pressable>
            <Pressable onPress={() => chooseMedia('photo')} style={styles.mediaCard}>
              <View style={[styles.mediaIcon, { backgroundColor: '#34291E' }]}><Text style={styles.mediaEmoji}>▧</Text></View>
              <View style={styles.mediaText}><Text style={styles.mediaTitle}>Photo</Text><Text style={styles.mediaDesc}>Preview · Adjust · Crop · Text</Text></View>
              <Text style={styles.chevron}>↗</Text>
            </Pressable>
          </View>
          {busy && <View style={styles.loading}><ActivityIndicator color={C.lime} /><Text style={styles.loadingText}>Opening your media library…</Text></View>}
          {asset && <View style={styles.selectedCard}>
            <Text style={styles.selectedLabel}>SELECTED {kind.toUpperCase()}</Text>
            {kind === 'photo' ? <Image source={{ uri: asset.uri }} style={styles.selectedImage} resizeMode="cover" /> :
              <View style={styles.videoPlaceholder}><Text style={styles.videoPlaceholderIcon}>▶</Text><Text style={styles.videoPlaceholderText}>VIDEO READY</Text></View>}
            <Text style={styles.assetName} numberOfLines={1}>{asset.name || (kind === 'video' ? 'Selected video' : 'Selected photo')}</Text>
            <Text style={styles.assetMeta}>{asset.type || 'Media file'}{asset.size ? '  ·  ' + (asset.size / 1048576).toFixed(1) + ' MB' : ''}</Text>
            <Button title={kind === 'video' ? 'Continue to video editor  →' : 'Continue to photo workspace  →'} onPress={startEditing} disabled={busy} />
            <Pressable onPress={() => chooseMedia(kind)} style={styles.changeButton}><Text style={styles.changeText}>Choose another file</Text></Pressable>
          </View>}
          <View style={styles.permissionNote}><Text style={styles.permissionIcon}>⌁</Text><Text style={styles.permissionText}>Android’s system picker gives access only to the file you select. No broad gallery permission is needed. Microphone access is requested by the editor only when you use voice-over.</Text></View>
        </ScrollView>
      </>}

      {screen === 'photo-editor' && asset && <>
        {topBar(true)}
        <ScrollView contentContainerStyle={styles.photoContent}>
          <Text style={styles.step}>STEP 02 / PHOTO WORKSPACE</Text>
          <View style={styles.photoHeader}><View><Text style={styles.pageTitleSmall}>Your frame.</Text><Text style={styles.subheadSmall}>A first look at your photo tools.</Text></View><Text style={styles.previewTag}>PREVIEW</Text></View>
          <Image source={{ uri: asset.uri }} style={styles.photoPreview} resizeMode="contain" />
          <View style={styles.toolHeader}><Text style={styles.sectionTitle}>TOOLS</Text><Text style={styles.sectionHint}>PHOTO DEMO</Text></View>
          <View style={styles.toolGrid}>
            {['Adjust', 'Crop', 'Filters', 'Text'].map((tool) => (
              <Pressable key={tool} onPress={() => setSelectedTool(tool)} style={[styles.tool, selectedTool === tool && styles.toolActive]}>
                <Text style={[styles.toolName, selectedTool === tool && styles.toolNameActive]}>{tool}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.demoNotice}><Text style={styles.demoNoticeTitle}>Photo workspace preview</Text><Text style={styles.demoNoticeText}>The connected native SDK currently edits videos. This screen is a UI demo for photo editing; photo filters and export are not wired up yet.</Text></View>
          <Button title="Choose another media file" secondary onPress={reset} />
        </ScrollView>
      </>}

      <View style={styles.bottomNote}><Text style={styles.bottomNoteText}>TRISVAX STUDIO  ·  MADE FOR CREATORS</Text></View>
      <VideoEditorHost />
    </SafeAreaView>
  );
}

export default function App() {
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
    <SafeAreaProvider><AppContent /></SafeAreaProvider>
  </GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: { minHeight: 58, paddingHorizontal: 22, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { color: C.bg, fontWeight: '900', fontSize: 18 },
  brand: { color: C.white, fontSize: 12, fontWeight: '900', letterSpacing: 2, flex: 1 },
  brandThin: { color: C.muted, fontWeight: '500' },
  topTag: { borderWidth: 1, borderColor: C.line, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: C.lime },
  topTagText: { color: C.muted, fontSize: 9, letterSpacing: 1.4, fontWeight: '800' },
  back: { color: C.white, fontSize: 34, width: 30, lineHeight: 36 },
  homeContent: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 28 },
  eyebrow: { alignSelf: 'flex-start', borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5 },
  eyebrowText: { color: C.lime, fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  hero: { color: C.white, fontSize: 62, lineHeight: 64, fontWeight: '900', letterSpacing: -2.5, marginTop: 22 },
  heroAccent: { color: C.lime },
  subhead: { color: C.muted, fontSize: 14, lineHeight: 22, marginTop: 14, maxWidth: 320 },
  artCard: { marginTop: 28, height: 238, backgroundColor: '#20291D', borderRadius: 18, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#34402D' },
  artTop: { flexDirection: 'row', justifyContent: 'space-between' },
  artLabel: { color: '#AAB79A', fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  artVisual: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  artRing: { width: 126, height: 126, borderRadius: 70, borderWidth: 1, borderColor: '#82966A', alignItems: 'center', justifyContent: 'center' },
  artInner: { width: 94, height: 94, borderRadius: 50, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#172014', fontSize: 28, marginLeft: 4 },
  artCaption: { position: 'absolute', bottom: 2, right: 0, alignItems: 'flex-end' },
  artCaptionSmall: { color: '#AAB79A', fontSize: 8, letterSpacing: 2, fontWeight: '800' },
  artCaptionBig: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: 1.1 },
  artBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  artArrow: { color: C.lime, fontSize: 18 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 14 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  sectionHint: { color: C.dim, fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  button: { height: 54, borderRadius: 12, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  buttonText: { color: '#151A11', fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },
  buttonTextSecondary: { color: C.white },
  footnote: { color: C.dim, textAlign: 'center', fontSize: 10, marginTop: 16 },
  selectContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26 },
  step: { color: C.lime, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  pageTitle: { color: C.white, fontSize: 43, lineHeight: 47, fontWeight: '900', letterSpacing: -1.6, marginTop: 15 },
  mediaOptions: { gap: 12, marginTop: 30 },
  mediaCard: { minHeight: 92, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14 },
  mediaIcon: { width: 52, height: 52, borderRadius: 13, backgroundColor: '#29351E', alignItems: 'center', justifyContent: 'center' },
  mediaEmoji: { color: C.lime, fontSize: 22, fontWeight: '900' },
  mediaText: { flex: 1 },
  mediaTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  mediaDesc: { color: C.muted, fontSize: 11, marginTop: 5 },
  chevron: { color: C.lime, fontSize: 20 },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 20 },
  loadingText: { color: C.muted, fontSize: 12 },
  selectedCard: { marginTop: 22, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#3C4B2E', backgroundColor: '#151D12' },
  selectedLabel: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 12 },
  selectedImage: { width: '100%', height: 190, borderRadius: 10, backgroundColor: C.panel2 },
  videoPlaceholder: { height: 112, borderRadius: 10, backgroundColor: '#222D1D', alignItems: 'center', justifyContent: 'center' },
  videoPlaceholderIcon: { color: C.lime, fontSize: 28 },
  videoPlaceholderText: { color: C.muted, fontSize: 9, letterSpacing: 1.5, marginTop: 6, fontWeight: '800' },
  assetName: { color: C.white, fontSize: 14, fontWeight: '800', marginTop: 13 },
  assetMeta: { color: C.muted, fontSize: 10, marginTop: 5, marginBottom: 12 },
  changeButton: { alignItems: 'center', paddingVertical: 12 },
  changeText: { color: C.lime, fontSize: 12, fontWeight: '700' },
  permissionNote: { flexDirection: 'row', gap: 10, backgroundColor: C.panel, borderRadius: 12, padding: 14, marginTop: 24 },
  permissionIcon: { color: C.lime, fontSize: 20 },
  permissionText: { color: C.muted, fontSize: 10, lineHeight: 16, flex: 1 },
  photoContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 32 },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  pageTitleSmall: { color: C.white, fontSize: 30, fontWeight: '900' },
  subheadSmall: { color: C.muted, fontSize: 12, marginTop: 5 },
  previewTag: { color: C.lime, fontSize: 9, letterSpacing: 1.5, borderWidth: 1, borderColor: C.line, padding: 8, borderRadius: 6 },
  photoPreview: { width: '100%', height: 330, marginTop: 20, backgroundColor: C.panel, borderRadius: 16 },
  toolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 },
  toolGrid: { flexDirection: 'row', gap: 8 },
  tool: { flex: 1, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  toolActive: { backgroundColor: '#28351D', borderColor: C.lime },
  toolName: { color: C.muted, fontSize: 11, fontWeight: '700' },
  toolNameActive: { color: C.lime },
  demoNotice: { backgroundColor: '#211C14', borderWidth: 1, borderColor: '#493923', padding: 14, borderRadius: 12, marginTop: 18, marginBottom: 14 },
  demoNoticeTitle: { color: C.orange, fontSize: 12, fontWeight: '900' },
  demoNoticeText: { color: '#B6A58F', fontSize: 10, lineHeight: 16, marginTop: 6 },
  bottomNote: { paddingHorizontal: 22, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1A201A', alignItems: 'center' },
  bottomNoteText: { color: C.dim, fontSize: 8, letterSpacing: 1.7, fontWeight: '800' },
});
