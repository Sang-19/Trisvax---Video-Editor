# Trisvax Video Editor

A native Android demo app built with React Native and the react-native-video-editor SDK. The app is designed for a physical Android phone; no emulator is required.

## App experience

1. Home: an aesthetic creator-studio landing screen.
2. Choose media: the user chooses Video or Photo.
3. System picker: Android opens its document/media picker for the selected type.
4. Video editing: selected videos open the native editor with Trim, Crop, Background Music, Text Overlay and Voice-over enabled.
5. Photo workspace: selected photos open a demo photo-editing workspace with a preview and tool selection.

Photo limitation: the connected SDK currently edits videos only. The photo workspace is a UI demo; photo adjustments, filters and export are not implemented yet.

## Permissions and privacy

The app uses Android's system document picker, so it does not request broad photo/video library access. Android grants access to the file the user selects. The SDK requests microphone access when voice-over is used. The manifest declares RECORD_AUDIO and the legacy write permission only through Android API 32 for SDK export compatibility.

Media is selected locally on the device. The app does not upload it to a server.

## Windows setup

Requirements:
- Docker Desktop and Docker Compose.
- Windows Android Platform-Tools (adb) on PATH.
- USB debugging enabled on the physical phone; accept the authorization prompt.

Double-click start.bat. It starts/checks Docker Desktop, builds the development image, starts the container and checks Node.js, Yarn, Java and Android SDK. Logs: logs/start.log.

## Run the app

1. Run start.bat and wait for the Docker environment to become ready.
2. Connect and authorize your Android phone over USB.
3. Run android-metro.bat in one terminal window.
4. Run android-build.bat in another window. This installs dependencies, runs the SDK's peer-dependency/patch setup, and builds the ARM64 debug APK.
5. Run android-install.bat to install the APK and configure adb reverse.

APK output: android/app/build/outputs/apk/debug/app-debug.apk.

## Docker / USB architecture

ADB runs on Windows as the USB bridge because Docker Desktop does not automatically expose a USB Android device to a Linux container. Node.js, Yarn, Metro, Java, Android SDK and Gradle run inside Docker.

Useful commands:
- adb devices
- adb reverse tcp:8081 tcp:8081


## SDK integration

Package: @zlucksolutions/react-native-video-editor 1.0.3.

VideoEditorHost is mounted once at the app root. Videos are passed to openVideoEditor with trim, crop, BGM, text overlay and voice-over enabled. The SDK's documented install command is run by android-build.bat through yarn setup:video-editor.

## Build note

The Docker image build downloads Android SDK components and Gradle 9.0.0, so the first start.bat run can take a while. The actual Android build has not been executed on your Windows machine yet; use the log output to diagnose any environment-specific issue.
