
# Custom Dev Client Setup for On-Device OCR

NumSnap Daily uses **on-device OCR** (Optical Character Recognition) to detect 6-digit numbers from photos with **zero cloud API costs**. This requires a custom development client build with native modules.

## Why Custom Dev Client?

- **iOS**: Apple Vision framework requires native Swift/Objective-C bridging
- **Android**: Google ML Kit requires native Kotlin/Java integration
- **Expo Go**: Does not support custom native modules
- **Solution**: Build a custom dev client with `expo-dev-client`

## Current Status

The OCR implementation is **ready** but requires native module integration:

- ✅ `utils/ocr.ts` - Cross-platform OCR dispatcher
- ✅ `utils/ocr.ios.ts` - iOS Vision framework integration (needs native bridge)
- ✅ `utils/ocr.android.ts` - Android ML Kit integration (needs native bridge)
- ✅ `app/confirm-submission.tsx` - UI with OCR processing and fallback
- ⏳ Native modules - Need to be added to custom dev client

## Option 1: iOS - Apple Vision Framework (Recommended)

### Requirements
- iOS 13+ (all modern devices)
- Xcode 12+
- Custom dev client build

### Implementation Steps

1. **Install expo-dev-client** (already installed):
   ```bash
   npx expo install expo-dev-client
   ```

2. **Create native module for Vision framework**:
   
   Create `ios/VisionOCRModule.swift`:
   ```swift
   import Vision
   import UIKit
   
   @objc(VisionOCRModule)
   class VisionOCRModule: NSObject {
     
     @objc
     func recognizeText(_ imageUri: String, 
                       options: NSDictionary,
                       resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock) {
       
       guard let url = URL(string: imageUri),
             let imageData = try? Data(contentsOf: url),
             let image = UIImage(data: imageData),
             let cgImage = image.cgImage else {
         rejecter("INVALID_IMAGE", "Could not load image", nil)
         return
       }
       
       let request = VNRecognizeTextRequest { request, error in
         if let error = error {
           rejecter("OCR_ERROR", error.localizedDescription, error)
           return
         }
         
         guard let observations = request.results as? [VNRecognizedTextObservation] else {
           resolver(["textBlocks": [], "confidence": 0])
           return
         }
         
         var textBlocks: [String] = []
         var totalConfidence: Float = 0
         
         for observation in observations {
           if let topCandidate = observation.topCandidates(1).first {
             textBlocks.append(topCandidate.string)
             totalConfidence += topCandidate.confidence
           }
         }
         
         let avgConfidence = textBlocks.isEmpty ? 0 : totalConfidence / Float(textBlocks.count)
         
         resolver([
           "textBlocks": textBlocks,
           "confidence": avgConfidence
         ])
       }
       
       // Configure Vision request
       request.recognitionLevel = .fast
       request.recognitionLanguages = ["en-US"]
       request.minimumTextHeight = 0.05
       request.usesLanguageCorrection = true
       
       let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
       
       DispatchQueue.global(qos: .userInitiated).async {
         do {
           try handler.perform([request])
         } catch {
           rejecter("OCR_ERROR", error.localizedDescription, error)
         }
       }
     }
     
     @objc
     static func requiresMainQueueSetup() -> Bool {
       return false
     }
   }
   ```

3. **Create bridge header** `ios/VisionOCRModule.m`:
   ```objc
   #import <React/RCTBridgeModule.h>
   
   @interface RCT_EXTERN_MODULE(VisionOCRModule, NSObject)
   
   RCT_EXTERN_METHOD(recognizeText:(NSString *)imageUri
                     options:(NSDictionary *)options
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject)
   
   @end
   ```

4. **Update `utils/ocr.ios.ts`** to use the native module:
   ```typescript
   import { NativeModules } from 'react-native';
   const { VisionOCRModule } = NativeModules;
   
   async function performVisionOCR(imageUri: string): Promise<{ text: string[]; confidence: number }> {
     if (VisionOCRModule && VisionOCRModule.recognizeText) {
       const result = await VisionOCRModule.recognizeText(imageUri, {
         recognitionLevel: 'fast',
         recognitionLanguages: ['en-US'],
         minimumTextHeight: 0.05,
         usesLanguageCorrection: true,
       });
       return { text: result.textBlocks, confidence: result.confidence };
     }
     return { text: [], confidence: 0 };
   }
   ```

5. **Build custom dev client**:
   ```bash
   npx expo prebuild
   npx expo run:ios
   ```

## Option 2: Android - Google ML Kit (Recommended)

### Requirements
- Android 5.0+ (API 21+)
- Android Studio
- Custom dev client build

### Implementation Steps

1. **Add ML Kit dependency** to `android/app/build.gradle`:
   ```gradle
   dependencies {
     implementation 'com.google.mlkit:text-recognition:16.0.0'
   }
   ```

2. **Create native module** `android/app/src/main/java/com/yourapp/MLKitOCRModule.kt`:
   ```kotlin
   package com.yourapp
   
   import com.facebook.react.bridge.*
   import com.google.mlkit.vision.common.InputImage
   import com.google.mlkit.vision.text.TextRecognition
   import com.google.mlkit.vision.text.latin.TextRecognizerOptions
   import java.io.File
   
   class MLKitOCRModule(reactContext: ReactApplicationContext) : 
     ReactContextBaseJavaModule(reactContext) {
     
     override fun getName() = "MLKitOCRModule"
     
     @ReactMethod
     fun recognizeText(imageUri: String, options: ReadableMap, promise: Promise) {
       try {
         val file = File(imageUri.replace("file://", ""))
         val image = InputImage.fromFilePath(reactApplicationContext, android.net.Uri.fromFile(file))
         
         val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
         
         recognizer.process(image)
           .addOnSuccessListener { visionText ->
             val textBlocks = visionText.textBlocks.map { it.text }
             val result = Arguments.createMap().apply {
               putArray("textBlocks", Arguments.fromList(textBlocks))
               putDouble("confidence", 0.85)
             }
             promise.resolve(result)
           }
           .addOnFailureListener { e ->
             promise.reject("OCR_ERROR", e.message, e)
           }
       } catch (e: Exception) {
         promise.reject("OCR_ERROR", e.message, e)
       }
     }
   }
   ```

3. **Register module** in `android/app/src/main/java/com/yourapp/MainApplication.kt`:
   ```kotlin
   override fun getPackages(): List<ReactPackage> {
     return PackageList(this).packages.apply {
       add(MLKitOCRPackage())
     }
   }
   ```

4. **Update `utils/ocr.android.ts`** to use the native module:
   ```typescript
   import { NativeModules } from 'react-native';
   const { MLKitOCRModule } = NativeModules;
   
   async function performMLKitOCR(imageUri: string): Promise<{ text: string[]; confidence: number }> {
     if (MLKitOCRModule && MLKitOCRModule.recognizeText) {
       const result = await MLKitOCRModule.recognizeText(imageUri, {
         language: 'en',
         accuracy: 'high',
       });
       return { text: result.textBlocks, confidence: result.confidence };
     }
     return { text: [], confidence: 0 };
   }
   ```

5. **Build custom dev client**:
   ```bash
   npx expo prebuild
   npx expo run:android
   ```

## Option 3: Use Expo Config Plugin (Easiest)

For Android, you can use the `expo-google-mlkit-text-recognition` package (if available):

```bash
npx expo install expo-google-mlkit-text-recognition
```

Then update `app.json`:
```json
{
  "expo": {
    "plugins": [
      "expo-google-mlkit-text-recognition"
    ]
  }
}
```

## Testing OCR

1. **Build custom dev client**:
   ```bash
   npx eas build --profile development --platform ios
   npx eas build --profile development --platform android
   ```

2. **Install on device**:
   - Download the build from EAS
   - Install on your test device

3. **Test with clear photos**:
   - Take photos of 6-digit numbers (house numbers, receipts, signs)
   - Ensure good lighting and focus
   - Try different angles and distances

4. **Check logs**:
   - Look for `[OCR iOS]` or `[OCR Android]` logs
   - Verify detected text and confidence scores
   - Confirm 6-digit number extraction

## Current Behavior (Without Native Modules)

- ✅ Photo upload works
- ✅ UI shows "Processing on-device..."
- ⚠️ OCR returns empty results (no native module)
- ✅ User can manually enter number
- ✅ Submission works with manual entry

## After Native Module Integration

- ✅ Photo upload works
- ✅ OCR detects text from photo
- ✅ Extracts 6-digit numbers automatically
- ✅ Pre-fills confirmation field
- ✅ User can edit if needed
- ✅ Submission works with detected or manual entry

## Troubleshooting

### iOS Vision Not Working
- Check iOS version (13+ required)
- Verify native module is registered
- Check Xcode build logs
- Ensure image URI is accessible

### Android ML Kit Not Working
- Check Android API level (21+ required)
- Verify ML Kit dependency in build.gradle
- Check logcat for errors
- Ensure READ_EXTERNAL_STORAGE permission

### OCR Returns Empty Results
- Check image quality (blur, lighting, angle)
- Verify text is clearly visible
- Try closer zoom or better lighting
- Check console logs for errors

## Benefits of On-Device OCR

- ✅ **Zero Cloud Costs**: No API fees (Vision/ML Kit are free)
- ✅ **Privacy**: Photos never leave the device
- ✅ **Speed**: Instant processing (no network latency)
- ✅ **Offline**: Works without internet connection
- ✅ **Scalability**: No rate limits or quotas

## Next Steps

1. Choose implementation option (native modules or config plugin)
2. Build custom dev client with OCR support
3. Test on real devices with various photos
4. Fine-tune OCR parameters for best accuracy
5. Deploy to production via EAS Build

## Resources

- [Expo Dev Client Docs](https://docs.expo.dev/develop/development-builds/introduction/)
- [Apple Vision Framework](https://developer.apple.com/documentation/vision)
- [Google ML Kit Text Recognition](https://developers.google.com/ml-kit/vision/text-recognition)
- [EAS Build](https://docs.expo.dev/build/introduction/)
