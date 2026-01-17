# Installing Dependencies for Electron and Android Builds

## Electron Build Dependencies

### 1. Python
Python is already installed on your system (version 3.13.7), which is sufficient for Electron builds.

### 2. Windows Build Tools
Instead of using the deprecated `windows-build-tools` package, you should install Visual Studio Build Tools directly:

1. Download Visual Studio Build Tools from Microsoft:
   - Visit: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Download "Build Tools for Visual Studio 2022"

2. Run the installer and select the following workloads:
   - C++ build tools
   - Windows 10 SDK (latest version)
   - CMake tools for C++

3. Make sure to also select these individual components:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows SDK (latest version)

### 3. Node.js Native Modules
Node.js now includes the necessary build tools for Windows. You shouldn't need additional installation.

## Android Build Dependencies

### 1. Java JDK
1. Download OpenJDK 11 or higher:
   - Visit: https://adoptium.net/
   - Download the latest LTS version (recommended: Temurin 11 or 17)
   - Choose Windows x64 version
   
2. Install the JDK by running the installer

3. Set the JAVA_HOME environment variable:
   - Open System Properties → Advanced → Environment Variables
   - Under System Variables, click New
   - Variable name: JAVA_HOME
   - Variable value: Path to your JDK installation (e.g., C:\Program Files\Eclipse Adoptium\jdk-11.0.x-hotspot)
   - Click OK

4. Add Java to your PATH:
   - In the same Environment Variables window
   - Select the Path variable and click Edit
   - Add: %JAVA_HOME%\bin
   - Click OK

### 2. Android SDK
1. Download Android Studio:
   - Visit: https://developer.android.com/studio
   - Download Android Studio

2. Install Android Studio:
   - Run the installer
   - During installation, make sure to install the Android SDK

3. Configure Android SDK:
   - Open Android Studio
   - Go to Settings → Appearance & Behavior → System Settings → Android SDK
   - Install the necessary SDK platforms (API 23 or higher recommended)
   - Install SDK tools:
     - Android SDK Build-Tools
     - Android SDK Platform-Tools
     - Android SDK Tools

### 3. Environment Variables for Android
1. Set ANDROID_HOME environment variable:
   - Variable name: ANDROID_HOME
   - Variable value: Path to your Android SDK (e.g., C:\Users\[Username]\AppData\Local\Android\Sdk)

2. Add Android tools to your PATH:
   - Add: %ANDROID_HOME%\tools
   - Add: %ANDROID_HOME%\platform-tools
   - Add: %ANDROID_HOME%\tools\bin

## Verification Steps

### For Electron Builds
After installing Visual Studio Build Tools, verify the installation by running:
```
npm rebuild
```

Then try building the Electron app:
```
npm run electron-dist
```

### For Android Builds
After installing Java and Android SDK, verify the installation by running:
```
java -version
javac -version
```

Then try building the Android app:
```
npx cap build android
```

## Troubleshooting Tips

1. If you encounter permission errors:
   - Run your command prompt as Administrator
   - Make sure no other processes are using the files

2. If builds still fail after installing dependencies:
   - Restart your computer to ensure environment variables are loaded
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. For Android builds specifically:
   - Make sure your Android SDK path doesn't contain spaces
   - Ensure you have enough disk space (at least 4GB free recommended)