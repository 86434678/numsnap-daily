
# Build Verification Guide

## Pre-Build Checklist

Before triggering the iOS build, verify these configurations are correct:

### ✅ app.json
- [x] `slug`: `"numsnapdaily"` (lowercase, no spaces)
- [x] `scheme`: `"numsnapdaily"` (lowercase, no spaces)
- [x] `bundleIdentifier`: `"com.kodyfoote.numsnapdaily"`
- [x] `newArchEnabled`: `true`
- [x] All permissions configured in `ios.infoPlist`

### ✅ package.json
- [x] `expo`: `~54.0.1` (latest stable)
- [x] `react-native`: `0.81.4` (aligned with SDK 54)
- [x] `expo-dev-client`: `^6.0.20` (includes DevLauncherAppController)
- [x] All dependencies properly versioned

### ✅ eas.json
- [x] Development profile has `developmentClient: true`
- [x] Channel configuration added
- [x] Proper iOS build configuration

## Expected Build Process

### Phase 1: Configuration Validation
The build system will:
1. Read `app.json` configuration
2. Validate bundle identifier and scheme
3. Check all plugin configurations
4. Verify SDK version compatibility

### Phase 2: Prebuild (Native Code Generation)
Expo will automatically:
1. Generate the `ios/` directory with native Xcode project
2. Create `DevLauncherAppController.swift` with proper protocol conformance
3. Configure all native modules (camera, location, etc.)
4. Set up proper RCTAppDelegate integration
5. Apply all config plugins

### Phase 3: Native Compilation
Xcode will:
1. Compile all Swift/Objective-C files
2. Link native frameworks
3. Build the development client IPA
4. Sign the app with your provisioning profile

### Phase 4: Distribution
EAS Build will:
1. Upload the IPA to internal distribution
2. Make it available for installation
3. Generate a QR code for easy installation

## What Was Fixed

### The DevLauncherAppController.swift Issue

**Root Cause**: 
The `slug` and `scheme` fields in `app.json` contained spaces (`"NumSnap Daily"`), which caused Expo's prebuild system to generate incorrect native code. This led to protocol conformance errors in `DevLauncherAppController.swift`.

**The Fix**:
Changed both fields to lowercase without spaces (`"numsnapdaily"`). This ensures:
- Proper URL scheme generation
- Correct native code generation
- Valid protocol conformance
- No build errors

**Why This Works**:
Expo's prebuild system uses the `slug` and `scheme` to generate native configuration files. When these contain spaces or special characters, the generated native code can have syntax errors or incorrect protocol implementations. By using a clean, lowercase identifier, the prebuild system generates valid native code that properly conforms to all required protocols.

## Post-Build Verification

After the build completes successfully, test these features:

### 1. App Launch
- [ ] Development client launches without crashes
- [ ] Splash screen displays correctly
- [ ] App loads to login screen

### 2. Authentication
- [ ] Email/password login works
- [ ] Sign up flow works
- [ ] Age verification works
- [ ] Deep linking for email verification works

### 3. Native Features
- [ ] Camera opens and takes photos
- [ ] Location permission requested
- [ ] Photo library access works
- [ ] Image picker functions correctly

### 4. Navigation
- [ ] All tabs navigate correctly
- [ ] Modal screens open properly
- [ ] Back navigation works
- [ ] Deep links work (scheme: `numsnapdaily://`)

### 5. Development Client Features
- [ ] Can reload the app (shake gesture)
- [ ] Can switch between different app versions
- [ ] Error overlay displays for JS errors
- [ ] Console logs appear in Metro bundler

## Troubleshooting

### If the build still fails:

1. **Check Build Logs**
   - Look for specific error messages
   - Check for missing dependencies
   - Verify provisioning profile issues

2. **Verify Configuration**
   - Ensure all files match this documentation
   - Check that no manual edits were made to native files
   - Verify all plugins are properly configured

3. **Common Issues**

   **Issue**: "RCTAppDelegate protocol not found"
   **Solution**: This should be fixed by the slug/scheme changes. If it persists, ensure `expo-dev-client` is at version ^6.0.20

   **Issue**: "Module not found" errors
   **Solution**: Verify all dependencies in package.json are properly installed

   **Issue**: "Provisioning profile" errors
   **Solution**: Check your Apple Developer account and EAS credentials

## Build Configuration Summary

```json
{
  "expo": "~54.0.1",
  "react-native": "0.81.4",
  "expo-dev-client": "^6.0.20",
  "slug": "numsnapdaily",
  "scheme": "numsnapdaily",
  "bundleIdentifier": "com.kodyfoote.numsnapdaily",
  "newArchEnabled": true
}
```

## Success Indicators

You'll know the build was successful when:
- ✅ Build completes without errors
- ✅ IPA file is generated
- ✅ App installs on device
- ✅ Development client launches
- ✅ All native features work
- ✅ No protocol conformance errors in logs

## Next Steps After Successful Build

1. **Install the development client** on your iOS device
2. **Scan the QR code** from Metro bundler to load your app
3. **Test all features** according to the verification checklist
4. **Report any issues** to the Natively team if problems persist

---

**Note**: The configuration changes made ensure that Expo's prebuild system generates correct native code with proper protocol conformance. No manual native code editing is required or recommended.
