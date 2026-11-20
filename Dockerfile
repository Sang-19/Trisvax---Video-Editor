FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/build-tools/36.0.0"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openjdk-17-jdk curl unzip zip git make g++ cmake ninja-build \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p "${ANDROID_HOME}/cmdline-tools" \
    && curl -fSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/android-tools.zip \
    && unzip -q /tmp/android-tools.zip -d /tmp/android-tools \
    && mkdir -p "${ANDROID_HOME}/cmdline-tools/latest" \
    && mv /tmp/android-tools/cmdline-tools/* "${ANDROID_HOME}/cmdline-tools/latest/" \
    && rm -rf /tmp/android-tools /tmp/android-tools.zip

RUN yes | sdkmanager --licenses >/dev/null 2>&1 || true

RUN sdkmanager \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;36.0.0" \
    "ndk;27.1.12297006" \
    "cmake;3.22.1"

RUN corepack enable

WORKDIR /workspace
EXPOSE 8081
CMD ["bash"]
