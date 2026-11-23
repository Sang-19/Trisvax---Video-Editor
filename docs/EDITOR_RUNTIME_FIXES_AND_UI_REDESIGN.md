# Trisvax Video Editor — Runtime Fixes and UI Redesign

## Purpose

Track the runtime fixes and full UI redesign for the native Android application. The uploaded screenshots are the primary UI reference.

## Current state (2026-11-23)

Confirmed repository changes already present on `main`:
- App theme uses an AppCompat-compatible parent, addressing the initial startup theme crash.
- Babel config uses `module:@react-native/babel-preset` and `react-native-worklets/plugin`.
- `@zlucksolutions/react-native-video-editor` is pinned to `1.0.7`.

Latest user device test:
- The app launches and reaches the React Native home/media-selection UI.
- Metro reports `Dev server ready` and serves a JS bundle.
- The prior screenshot set included:
  - `Cannot read property 'VideoEditorHost' of undefined`
  - `[Worklets] Failed to create a worklet`
  - A `useSafeAreaInsets` source frame in the component stack.
- Those last errors have not yet been proven resolved on the latest APK. Retest before closing this work.

Separate environment warning:
- React Native DevTools could not start because the Docker image lacks `libatk-bridge-2.0.so.0`.
- Metro itself reached ready state; treat this as a separate optional DevTools/container dependency issue.

## Runtime fixes to validate

### VideoEditorHost / SDK integration
- Verify the exact installed package version and resolved files in the container.
- Verify the SDK's package exports and Metro interop; package source exports `openVideoEditor`, `VideoEditorHost` and `VideoEditorSDK`.
- Verify native autolinking, native module registration and the documented installation/patch command.
- Reproduce editor launch on a clean build.
- Do not remove or replace the host component without evidence from the installed SDK API.

### Worklets / Reanimated
- Verify React Native 0.83, Reanimated 4.2.2 and Worklets 0.7.0 compatibility.
- Confirm Babel plugin runs in the correct configuration and ordering.
- Confirm the native APK was rebuilt after JS/native dependency changes.
- Restart Metro with `--reset-cache`, rebuild and test on a physical Android device.

### Safe area / gesture root
- Verify `GestureHandlerRootView` wraps the app root.
- Verify `SafeAreaProvider` wraps every component calling `useSafeAreaInsets`.
- Preserve current hierarchy unless runtime evidence requires a change.
- Check screen insets, system bars and navigation bar behaviour on device.

## Brand system — dark mode only

Use the actual dark-theme values from `Sang-19/trisvax---social-fitness---reels`:

| Token | Hex |
|---|---|
| Background | `#0B0807` |
| Card | `#18110D` |
| Secondary card | `#221711` |
| Primary accent | `#FF5500` |
| Primary text | `#FFFFFF` |
| Secondary text | `#9AA69B` |
| Muted text | `#667568` |
| Border | `#2B352D` |
| Orange accent | `#FF8232` |
| Blue accent | `#82B8FF` |
| Error | `#FF5A5A` |

The source CSS variable `--accent-lime` is actually `#FF5500`. Use the hex value, not green. No light theme and no theme toggle. Use a central theme/token file.

## Redesign scope

Use the supplied reference screenshots for screen structure, hierarchy, proportions and editing workflow. Do not substitute a generic dashboard.

### 1. Home / Studio
- Compact TRISVAX STUDIO header and logo.
- Two focused cards: Video and Photo.
- Video subtitle: Trim · Crop · Music · Text · Voice.
- Photo subtitle: Preview · Adjust · Crop · Text.
- Minimal, media-focused, dark UI.

### 2. Media picker
- Native device media access with real thumbnails.
- Photos/Videos tabs or filters.
- Duration and metadata where available.
- Both single and multiple selection.
- Visible selected state, count and Continue action.
- Preserve selection order.
- Permission-denied and empty states.
- Efficient handling of large libraries; no fake media.

### 3. Selected media preview
- Large actual preview.
- Close and Next controls.
- Multi-selection thumbnail strip/list.
- Remove and reorder clips.
- Return to picker without losing intended state.

### 4. Video editor
Follow the supplied editor references:
- Compact top bar with close, project status, undo, redo and next/export.
- Actual video preview maintaining source aspect ratio.
- Playback, current time and total duration.
- Thumbnail timeline, ruler/time markers and accurate playhead.
- Clip selection, ordering and removal for multi-clip projects.
- Scrollable editing toolbar, not a fixed overcrowded row.
- Tool panel opens for the selected operation without obscuring the preview/timeline.

### 5. Editing tools
Provide functional implementations, using documented SDK capabilities:
- Trim with start/end handles and preview.
- Crop with Original, 9:16, 16:9, 1:1 and 4:5 presets.
- Music/audio from device and bundled/licensed built-in assets.
- Audio placement, start/end, waveform where supported and volume.
- Text overlays with text, font, size, colour, alignment, positioning and duration.
- Voice-over record, stop, playback, delete, positioning and volume.
- Filters with preview and intensity where supported.
- Speed control with supported slow/normal/fast presets.
- Separate original video, music and voice-over volume controls.
- Undo/redo for operations the engine can reverse.
- Multiple clips, ordering, removal and per-clip editing.
- Transitions where the SDK supports them.

Do not expose a control as functional if it is only decorative. Clearly report unsupported SDK capabilities and implement a feasible native extension only after inspection.

### 6. Export
- 1080p Full HD default.
- Real export progress, percentage and processing state.
- Cancellation only where safely supported.
- Real success/error state.
- Save to device gallery and share.
- Never fake a completed export.

### 7. Photo workspace
- Real photo preview.
- Crop, aspect ratio, adjustments, filters, text and save/export where feasible.
- Same TRISVAX dark design language.
- Do not label placeholder controls as working tools.

## Architecture constraints

- Keep React Native 0.83, TypeScript, Android-native architecture and existing video editor SDK unless investigation proves a concrete incompatibility.
- User selected SDK-based editing: use the SDK as the editing engine and customise the surrounding React Native UI.
- No WebView replacement.
- No unnecessary dependencies, blind package upgrades or wholesale rewrites.
- Preserve working functionality and local-first media handling.
- Do not add login, accounts, social feeds or media upload to a server.

## Implementation update (2026-11-23)

Implemented in `src/App.tsx` on `fix/editor-runtime-and-redesign`:
- Replaced the previous green home screen with the dark TRISVAX palette (`#0B0807` background, `#18110D` cards, `#FF5500` accent) from the social-fitness repository.
- Added Video Studio and Photo Workspace entry cards.
- Added native Android picker flow with multi-selection for videos or photos.
- Added selected-media preview/list, selection count, remove and reorder controls, and add-more-media flow.
- Kept the SDK host mounted at the app root and retained the SDK-based single-video editor launch with trim, crop, BGM, text overlay and voice-over enabled.
- Added explicit UI messaging for the SDK's single-source limitation and for photo editing being unsupported by the installed video SDK; these are not represented as completed editing features.

Not implemented in this code change: custom in-app timeline/editor UI, multi-clip concatenation, native photo editing, custom audio library, transitions, filters, speed/volume controls, and 1080p export settings UI. The SDK README documents a single `source` URI and the listed video tools; it does not document a multi-clip timeline or photo editor API.

Validation limitation: this change was committed through GitHub and has not yet been built or tested on the user's physical Android device. Run the repository typecheck and Android build before merging; retest the previously reported Worklets/VideoEditorHost runtime errors.

## Acceptance checklist

- [ ] Fresh Android install launches without the AppCompat startup crash.
- [ ] Worklets initialise without runtime errors on a physical device.
- [ ] VideoEditorHost and native SDK editor open reliably.
- [ ] Safe-area and gesture hierarchy verified.
- [ ] Home and media picker match the supplied references and brand palette.
- [ ] Single and multiple photo/video selection work.
- [ ] Selected media preview uses actual media.
- [ ] Editor preview and timeline remain synchronised.
- [ ] Scrollable toolbar and editing panels work.
- [ ] Trim and crop work.
- [ ] Device audio import and built-in licensed/bundled audio work.
- [ ] Text overlays work.
- [ ] Voice-over works with permission requested only when required.
- [ ] Filters, speed and volume work where supported.
- [ ] Undo/redo works for supported edits.
- [ ] Multiple clips, ordering and removal work.
- [ ] Transitions work where supported.
- [ ] 1080p export, save and share work.
- [ ] No light-mode interface exists.
- [ ] No visible decorative/nonfunctional controls.
- [ ] TypeScript checks and Android build pass.
- [ ] End-to-end workflow verified on a physical Android device.

## Validation commands / workflow

Use the repository's Windows scripts and Docker-based Android toolchain:
1. Start the Docker environment.
2. Install dependencies and run the SDK setup/patch command.
3. Start Metro with cache reset.
4. Build the Android ARM64 debug APK.
5. Install on the authorised physical device.
6. Test launch, media selection, editor entry, every implemented tool, export, save and share.
7. Capture logs and screenshots for any failures.

Do not close the work based only on a successful Metro bundle. Validate the native APK.

## Reporting

For each stage, report:
- Files changed.
- Exact SDK APIs used.
- Commands executed.
- Build/typecheck results.
- Device test results.
- Known SDK limitations.
- Acceptance checklist status.

Do not claim a fix or feature is complete without evidence.
