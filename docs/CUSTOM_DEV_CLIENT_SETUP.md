
# Custom Development Client Setup

This guide explains how to build and install a custom development client for NumSnap Daily to test on-device OCR features.

## What is a Custom Development Client?

A custom development client is a version of your app that includes native modules (like on-device OCR) but still supports live reload and fast refresh during development. It's like Expo Go, but with your app's native code included.

## Prerequisites

Before building, ensure you have:
- An EAS account (sign up at https://expo.dev)
- For iOS: Apple Developer account
- For Android: No special account needed

## Configuration Changes Made

1. **Installed expo-dev-client**: This package enables custom development builds
2. **Updated app.json**: 
   - Changed slug to "numsnap-daily" (no spaces)
   - Changed scheme to "numsnapdaily" (for deep linking)
   - Set proper bundle identifiers for iOS and Android
3. **Updated eas.json**: Added proper development profile with `developmentClient: true`

## Building the Custom Dev Client

### For iOS (iPhone/iPad)

**Option 1: Build for Physical Device (Recommended)**
```bash
eas build --profile development --platform ios
```

**Option 2: Build for iOS Simulator (Testing Only)**
```bash
eas build --profile development --platform ios --local
```

After the build completes:
- You'll receive a download link via email and in the EAS dashboard
- Download the .ipa file (for device) or .tar.gz (for simulator)
- For device: Install using the EAS CLI or Apple Configurator
- For simulator: Drag and drop the .app file onto your simulator

### For Android

```bash
eas build --profile development --platform android
```

After the build completes:
- You'll receive a download link for an APK file
- Download the APK to your Android device
- Enable "Install from Unknown Sources" in your device settings
- Tap the APK file to install

## Installing the Built App

### iOS Installation Methods

**Method 1: Direct Install via EAS (Easiest)**
1. After build completes, open the EAS dashboard link on your iPhone
2. Tap "Install" - iOS will download and install the app
3. Trust the developer certificate in Settings > General > VPN & Device Management

**Method 2: Using Apple Configurator 2 (Mac only)**
1. Download Apple Configurator 2 from the Mac App Store
2. Connect your iPhone via USB
3. Drag the .ipa file onto your device in Configurator
4. Trust the certificate as above

### Android Installation

1. Download the APK file to your Android device (via email link or direct download)
2. Open the APK file from your Downloads folder
3. If prompted, enable "Install from Unknown Sources" for your browser/file manager
4. Tap "Install"
5. The app will be installed and appear in your app drawer

## Running the App with Live Reload

Once the custom dev client is installed on your device:

### Start the Development Server

```bash
npx expo start --dev-client
```

This will:
- Start the Metro bundler
- Show a QR code in your terminal
- Enable live reload and fast refresh

### Connect Your Device

**iOS:**
1. Open the NumSnap Daily dev client app on your iPhone
2. Scan the QR code from the terminal using your iPhone camera
3. The app will connect and load your JavaScript bundle

**Android:**
1. Open the NumSnap Daily dev client app on your Android device
2. Scan the QR code from the terminal
3. The app will connect and load your JavaScript bundle

**Alternative (if QR code doesn't work):**
- Make sure your device and computer are on the same WiFi network
- In the dev client app, tap "Enter URL manually"
- Enter the URL shown in the terminal (e.g., `exp://192.168.1.100:8081`)

## Testing On-Device OCR

With the custom dev client installed:

1. Start the dev server: `npx expo start --dev-client`
2. Open the app on your device and connect to the dev server
3. Navigate to the camera/photo submission flow
4. Take a photo with numbers
5. The on-device OCR will process the image:
   - **iOS**: Uses Apple's VisionKit (VNRecognizeTextRequest)
   - **Android**: Uses Google's ML Kit Text Recognition
6. You'll see the detected number in the confirmation screen

## Troubleshooting

### Build Fails
- Make sure you're logged into EAS: `eas login`
- Check that your bundle identifiers are unique
- Verify your Apple Developer account is active (for iOS)

### App Won't Install on iOS
- Trust the developer certificate: Settings > General > VPN & Device Management
- Make sure your device UDID is registered in your Apple Developer account
- Try rebuilding with `--clear-cache` flag

### App Won't Connect to Dev Server
- Ensure device and computer are on the same WiFi network
- Try entering the URL manually instead of scanning QR code
- Check firewall settings aren't blocking the connection
- Restart the dev server with `npx expo start --dev-client --clear`

### OCR Not Working
- Make sure you built with the development profile (includes native modules)
- Check device permissions for camera and photo library
- Look at the console logs for error messages

## When to Rebuild

You need to rebuild the custom dev client when:
- You add new native modules or dependencies
- You change native configuration (app.json plugins, permissions, etc.)
- You update Expo SDK version
- You change bundle identifiers or app name

You do NOT need to rebuild for:
- JavaScript/TypeScript code changes (uses live reload)
- UI/styling changes
- Business logic changes
- API endpoint changes

## Next Steps

After installing the custom dev client:
1. Test the on-device OCR feature thoroughly
2. Make JavaScript changes and see them live reload
3. When ready for production, build with: `eas build --profile production --platform all`

## Additional Resources

- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- expo-dev-client Documentation: https://docs.expo.dev/develop/development-builds/introduction/
- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/numsnap-daily
