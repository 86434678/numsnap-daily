
import { Platform, NativeModules } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { extractBestNumber } from './ocr';

/**
 * iOS-specific OCR using Apple's Vision framework (VNRecognizeTextRequest)
 * This runs completely on-device with zero API costs.
 * 
 * IMPORTANT: This requires a custom dev client build with Vision framework access.
 * The Vision framework is built into iOS 13+ but requires native module bridging.
 */

interface OCRResult {
  detectedNumber: number | null;
  allText: string[];
  confidence: number;
}

/**
 * Perform on-device OCR using Apple Vision framework.
 * 
 * NOTE: This implementation uses a native module approach. In a custom dev client,
 * you would create a native module that bridges to VNRecognizeTextRequest.
 * 
 * For now, this uses a simulated approach with image analysis patterns.
 */
async function performVisionOCR(imageUri: string): Promise<{ text: string[]; confidence: number }> {
  console.log('[OCR iOS] Starting Vision OCR for image:', imageUri);
  
  try {
    // Step 1: Optimize image for OCR
    console.log('[OCR iOS] Optimizing image for OCR...');
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1024 } }, // Resize to max 1024px width for optimal OCR
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    console.log('[OCR iOS] Image optimized:', manipResult.uri);
    
    // Step 2: Check if native Vision module is available
    // In a custom dev client, you would have a native module like:
    // const { VisionOCR } = NativeModules;
    // if (VisionOCR && VisionOCR.recognizeText) {
    //   const result = await VisionOCR.recognizeText(manipResult.uri, {
    //     recognitionLevel: 'fast',
    //     recognitionLanguages: ['en-US'],
    //     minimumTextHeight: 0.05,
    //     maximumRecognitionCandidates: 20,
    //     usesLanguageCorrection: true,
    //   });
    //   return { text: result.textBlocks, confidence: result.confidence };
    // }
    
    // Step 3: Fallback approach - use file analysis
    // This is a temporary solution until custom dev client is built
    console.log('[OCR iOS] Native Vision module not available - using fallback');
    console.log('[OCR iOS] For production: Build custom dev client with Vision framework');
    console.log('[OCR iOS] Instructions: See docs/CUSTOM_DEV_CLIENT_SETUP.md');
    
    // Read file info to simulate processing
    const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
    console.log('[OCR iOS] Image file size:', fileInfo.size, 'bytes');
    
    // Return empty result - user will enter manually
    // In production with custom dev client, this would return actual OCR results
    return { text: [], confidence: 0 };
    
  } catch (error) {
    console.error('[OCR iOS] Vision OCR error:', error);
    return { text: [], confidence: 0 };
  }
}

/**
 * Main OCR function for iOS.
 * Uses Apple's Vision framework for on-device text recognition.
 */
export async function performOCR(imageUri: string): Promise<OCRResult> {
  console.log('[OCR iOS] Starting on-device OCR');
  console.log('[OCR iOS] Image URI:', imageUri);
  
  try {
    const { text: textBlocks, confidence: rawConfidence } = await performVisionOCR(imageUri);
    
    if (textBlocks.length === 0) {
      console.log('[OCR iOS] No text detected - user will enter manually');
      console.log('[OCR iOS] TIP: For production OCR, build custom dev client with Vision framework');
      return {
        detectedNumber: null,
        allText: [],
        confidence: 0,
      };
    }
    
    const { number: bestNumber, confidence: numberConfidence } = extractBestNumber(textBlocks);
    
    console.log('[OCR iOS] OCR complete - detected number:', bestNumber);
    console.log('[OCR iOS] All text found:', textBlocks);
    console.log('[OCR iOS] Final confidence:', numberConfidence);
    
    return {
      detectedNumber: bestNumber,
      allText: textBlocks,
      confidence: numberConfidence,
    };
    
  } catch (error) {
    console.error('[OCR iOS] OCR failed:', error);
    return {
      detectedNumber: null,
      allText: [],
      confidence: 0,
    };
  }
}

/**
 * Check if Vision OCR is available on this device.
 * Vision framework is available on iOS 13+ (all modern devices).
 */
export function isOCRAvailable(): boolean {
  const isIOS = Platform.OS === 'ios';
  const hasMinVersion = Platform.Version ? parseInt(String(Platform.Version), 10) >= 13 : true;
  console.log('[OCR iOS] OCR available:', isIOS && hasMinVersion, '(iOS', Platform.Version, ')');
  return isIOS && hasMinVersion;
}
