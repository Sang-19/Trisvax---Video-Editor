# Trisvax Video Editor

Docker-first React Native Android video-editor workspace for a **physical Android phone**. No Android emulator is required.

## Current repository status

This repository contains the Docker development environment and Windows startup/helper scripts. The React Native application scaffold and integration of the video editor SDK have not yet been added.

Planned SDK: https://github.com/zlucksolutions/react-native-video-editor

The SDK provides video trimming, cropping/aspect ratio, background music, text overlays and voice-over.

## Windows requirements

- Docker Desktop installed (the startup script attempts to launch it automatically).
- Docker Compose v2 plugin.
- Android SDK Platform-Tools (`adb`) on Windows PATH for physical-device deployment.
- Physical Android phone with Developer Options and USB debugging enabled.
- Accept the USB debugging authorization prompt on the phone.

Android Studio and an Android emulator are not required.

## Start the environment

Double-click **start.bat**.

The batch file is the only startup entry point; it does not call Python or any other launcher. It:

1. Checks Docker CLI and Docker Compose.
2. Starts Docker Desktop when the daemon is not running, then waits for it.
3. Checks for an authorized physical Android phone (ADB/device absence is a warning, not a blocker for preparing Docker).
4. Builds the Docker image and starts the development container.
5. Verifies Node.js, Yarn, Java and the Android SDK inside Docker.
6. Prints `[SUCCESS]`, `[WARNING]` or `[FAILED]` for each step and writes output to `logs/start.log`.

## Android helper scripts

After a React Native app scaffold exists:

- `android-metro.bat` starts Metro inside Docker.
- `android-build.bat` builds an ARM64 debug APK inside Docker.
- `android-install.bat` uses Windows ADB to reverse port 8081 and install the APK on the connected phone.

## USB / ADB architecture

Docker Desktop on Windows does not automatically pass a USB Android device into a Linux container. For this setup, ADB runs on Windows as the USB bridge; Node.js, Yarn, Metro, Java, Android SDK and Gradle run inside Docker.

Useful commands from Windows CMD:

`adb devices`

`adb reverse tcp:8081 tcp:8081`

## Planned SDK integration

Once the React Native host app is scaffolded:

1. Install `@zlucksolutions/react-native-video-editor`.
2. Install its documented peer dependencies.
3. Add `patch-package` postinstall support and apply the SDK's documented patch.
4. Add Android microphone permission for voice-over.
5. Mount `<VideoEditorHost />` once near the app root.
6. Call `openVideoEditor` with the selected source and editing options.
7. Pass the exported media URI to the preview/upload flow.

Follow the SDK documentation for the complete integration: https://github.com/zlucksolutions/react-native-video-editor

## Important

A successful `start.bat` run confirms the Docker toolchain is ready. It does not mean the app itself can build yet: the React Native app scaffold and SDK dependencies must be added before running `android-build.bat`.
