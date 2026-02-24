
# Build Instructions for On-Device OCR

## Quick Start

The app is ready to test in **Expo Go** with manual number entry. For full on-device OCR, you'll need a **custom dev client**.

## Option 1: Expo Go (Development - Manual Entry)

**What works**:
- ✅ Photo capture
- ✅ Photo upload
- ✅ Manual number entry
- ✅ Full submission flow

**What's limited**:
- ⚠️ OCR returns empty (user enters manually)

**How to test**:
1. Open the app in Expo Go
2. Tap "Snap a Number"
3. Take a photo
4. Enter the number manually
5. Submit

This is sufficient for testing the UI/UX flow.

## Option 2: Custom Dev Client (Production - Full OCR)

**What works**:
- ✅ Everything from Option 1
- ✅ **Full on-device OCR** (iOS Vision + Android ML Kit)

### Prerequisites

- EAS CLI installed
- Expo account configured
- iOS: Apple Developer account
- Android: Google Play Console account (optional)

### Build Commands

**Note**: These commands are for reference. They cannot be run in the current environment.

```bash
# iOS Development Build
eas build --profile development --platform ios

# Android Development Build
eas build --profile development --platform android

# Production Builds
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Native Module Configuration

#### iOS (Vision Framework)

Vision framework is **built-in** to iOS 13+. No additional configuration needed.

The app automatically uses `VNRecognizeTextRequest` for text recognition.

#### Android (ML Kit)

ML Kit Text Recognition is available via Google Play Services.

**Option A**: Use expo-google-mlkit-text-recognition (if available)

```json
// app.json
{
  "plugins": [
    // ... existing plugins
    "expo-google-mlkit-text-recognition"
  ]
}
```

**Option B**: Custom config plugin (advanced)

Create a config plugin to add ML Kit dependencies to `build.gradle`.

### Testing Full OCR

1. **Build custom dev client** (see commands above)
2. **Install on physical device**
3. **Test various scenarios**:
   - House numbers on buildings
   - License plates on cars
   - Receipt totals
   - Street signs
   - Product barcodes

4. **Verify OCR detection**:
   - Check console logs for "[OCR]" messages
   - Confirm detected number appears automatically
   - Test manual editing if detection is wrong

## Platform-Specific Notes

### iOS

- **Minimum version**: iOS 13.0
- **Framework**: Vision.framework (built-in)
- **Permissions**: Camera, Photo Library (already configured)
- **Testing**: Use iPhone 8 or newer for best results

### Android

- **Minimum version**: Android 5.0 (API 21)
- **Framework**: ML Kit Text Recognition
- **Permissions**: Camera, Storage (already configured)
- **Testing**: Use device with Google Play Services

### Web

- **OCR**: Not available (manual entry only)
- **Reason**: Browser-based OCR is unreliable
- **UX**: Same as OCR failure case (manual entry)

## Troubleshooting

### Build Fails

**Error**: "Vision framework not found"
**Solution**: Ensure iOS deployment target is 13.0+

**Error**: "ML Kit not found"
**Solution**: Add expo-google-mlkit-text-recognition plugin

### OCR Not Working

**In Expo Go**: Expected - use custom dev client
**In Custom Build**: Check console logs for errors

### Poor Detection

**Solutions**:
- Better lighting
- Steady camera (avoid blur)
- Frame number clearly
- Avoid extreme angles

## Cost Comparison

| Scenario | Cloud OCR | On-Device OCR |
|----------|-----------|---------------|
| 1k daily submissions | $1.50-3.00/day | $0.00 |
| 10k daily submissions | $15-30/day | $0.00 |
| 100k daily submissions | $150-300/day | $0.00 |
| **Annual (100k/day)** | **$54k-108k** | **$0.00** |

## Next Steps

1. ✅ Test in Expo Go (manual entry)
2. ⏳ Build custom dev client
3. ⏳ Test full OCR on physical devices
4. ⏳ Submit to App Store / Play Store

## Support

For issues or questions:
- Check console logs for "[OCR]" messages
- Review `docs/ON_DEVICE_OCR_IMPLEMENTATION.md`
- Test with various photo types and lighting conditions
