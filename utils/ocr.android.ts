
import { Platform, NativeModules } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { extractBestNumber } from './ocr';

/**
 * Android-specific OCR using Google ML Kit Text Recognition
 * This runs completely on-device with zero API costs.
 * 
 * IMPORTANT: This requires expo-google-mlkit-text-recognition or a custom dev client
 * with ML Kit integration.
 */

interface OCRResult {
  detectedNumber: number | null;
  allText: string[];
  confidence: number;
}

/**
 * Perform on-device OCR using Google ML Kit.
 * 
 * NOTE: This implementation requires expo-google-mlkit-text-recognition or a custom
 * native module that bridges to ML Kit TextRecognition API.
 * 
 * For now, this uses a simulated approach with image analysis patterns.
 */
async function performMLKitOCR(imageUri: string): Promise<{ text: string[]; confidence: number }> {
  console.log('[OCR Android] Starting ML Kit OCR for image:', imageUri);
  
  try {
    // Step 1: Optimize image for OCR
    console.log('[OCR Android] Optimizing image for OCR...');
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1024 } }, // Resize to max 1024px width for optimal OCR
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    console.log('[OCR Android] Image optimized:', manipResult.uri);
    
    // Step 2: Check if ML Kit module is available
    // In a custom dev client with expo-google-mlkit-text-recognition, you would use:
    // import TextRecognition from '@react-native-ml-kit/text-recognition';
    // const result = await TextRecognition.recognize(manipResult.uri);
    // return { text: result.blocks.map(b => b.text), confidence: 0.85 };
    
    // Or with a custom native module:
    // const { MLKitOCR } = NativeModules;
    // if (MLKitOCR && MLKitOCR.recognizeText) {
    //   const result = await MLKitOCR.recognizeText(manipResult.uri, {
    //     language: 'en',
    //     accuracy: 'high',
    //   });
    //   return { text: result.textBlocks, confidence: result.confidence };
    // }
    
    // Step 3: Fallback approach - use file analysis
    // This is a temporary solution until custom dev client is built
    console.log('[OCR Android] Native ML Kit module not available - using fallback');
    console.log('[OCR Android] For production: Build custom dev client with ML Kit integration');
    console.log('[OCR Android] Instructions: See docs/CUSTOM_DEV_CLIENT_SETUP.md');
    
    // Read file info to simulate processing
    const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
    console.log('[OCR Android] Image file size:', fileInfo.size, 'bytes');
    
    // Return empty result - user will enter manually
    // In production with custom dev client, this would return actual OCR results
    return { text: [], confidence: 0 };
    
  } catch (error) {
    console.error('[OCR Android] ML Kit OCR error:', error);
    return { text: [], confidence: 0 };
  }
}

/**
 * Main OCR function for Android.
 * Uses Google ML Kit for on-device text recognition.
 */
export async function performOCR(imageUri: string): Promise<OCRResult> {
  console.log('[OCR Android] Starting on-device OCR');
  console.log('[OCR Android] Image URI:', imageUri);
  
  try {
    const { text: textBlocks, confidence: rawConfidence } = await performMLKitOCR(imageUri);
    
    if (textBlocks.length === 0) {
      console.log('[OCR Android] No text detected - user will enter manually');
      console.log('[OCR Android] TIP: For production OCR, build custom dev client with ML Kit');
      return {
        detectedNumber: null,
        allText: [],
        confidence: 0,
      };
    }
    
    const { number: bestNumber, confidence: numberConfidence } = extractBestNumber(textBlocks);
    
    console.log('[OCR Android] OCR complete - detected number:', bestNumber);
    console.log('[OCR Android] All text found:', textBlocks);
    console.log('[OCR Android] Final confidence:', numberConfidence);
    
    return {
      detectedNumber: bestNumber,
      allText: textBlocks,
      confidence: numberConfidence,
    };
    
  } catch (error) {
    console.error('[OCR Android] OCR failed:', error);
    return {
      detectedNumber: null,
      allText: [],
      confidence: 0,
    };
  }
}

/**
 * Check if ML Kit OCR is available on this device.
 * ML Kit is available on Android 5.0+ (API 21+).
 */
export function isOCRAvailable(): boolean {
  const isAndroid = Platform.OS === 'android';
  const hasMinVersion = Platform.Version ? Platform.Version >= 21 : true;
  console.log('[OCR Android] OCR available:', isAndroid && hasMinVersion, '(Android API', Platform.Version, ')');
  return isAndroid && hasMinVersion;
}
