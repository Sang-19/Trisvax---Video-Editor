# Trisvax Video Editor

Docker-first React Native Android video-editor workspace for a **physical Android phone**. No Android emulator is part of this workflow.

## Initial repository state
This repository initially contained only a placeholder README. The committed files add the Docker development environment, startup diagnostics and Windows helper scripts. The React Native application scaffold and SDK integration are not yet added.

Planned SDK: https://github.com/zlucksolutions/react-native-video-editor

The SDK includes video trim, crop/aspect ratio, background music, text overlays and voice-over.

## Windows prerequisites
- Docker Desktop running with the WSL 2 backend.
- Python 3.
- Android SDK Platform-Tools (adb) on Windows PATH.
- Physical Android phone with Developer Options and USB debugging enabled.
- Accept the USB debugging authorization prompt on the phone.

Android Studio and an Android emulator are not required.

## Start
Double-click start.bat. It runs start.py, checks Docker, Docker Compose, Docker daemon, ADB and device authorization, builds the Docker image, starts the container and checks Node, Java and Android SDK inside Docker. Timestamped logs are saved in logs/.

After a React Native app scaffold exists:
- android-metro.bat: start Metro inside Docker.
- android-build.bat: build ARM64 debug APK inside Docker.
- android-install.bat: configure USB ADB reverse and install APK on the phone.

## USB / ADB note
Docker Desktop on Windows does not automatically expose a USB Android device to a Linux container. ADB therefore runs on Windows as the USB bridge. Node.js, Yarn, Metro, Java, Android SDK and Gradle are intended to run in Docker.

```bat
adb devices
adb reverse tcp:8081 tcp:8081
```

## SDK integration plan
Once the React Native host app is created:
1. Install @zlucksolutions/react-native-video-editor.
2. Install its peer dependencies using the SDK's documented installer.
3. Add patch-package postinstall support and apply its documented audio-recorder patch.
4. Add Android microphone permission for voice-over.
5. Mount <VideoEditorHost /> once near the app root.
6. Call openVideoEditor with source and trim/crop/BGM/text/voice-over flags enabled.
7. Pass the exported URI to the preview/upload flow.

Follow the SDK README for complete integration: https://github.com/zlucksolutions/react-native-video-editor

## Important
A successful environment check does not prove that an app can build. The app scaffold and SDK dependencies must exist before running android-build.bat.
