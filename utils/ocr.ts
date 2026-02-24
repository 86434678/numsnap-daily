
import { Platform } from 'react-native';

/**
 * Cross-platform OCR utility.
 * Automatically uses the correct platform-specific implementation:
 * - iOS: Apple Vision framework (VNRecognizeTextRequest)
 * - Android: Google ML Kit Text Recognition
 * - Web: Fallback (manual entry only)
 */

export interface OCRResult {
  detectedNumber: number | null;
  allText: string[];
  confidence: number;
}

/**
 * Perform on-device OCR on the given image.
 * Returns the detected number and all text found.
 * 
 * @param imageUri - Local file URI of the image to process
 * @returns OCR result with detected number, all text, and confidence score
 */
export async function performOCR(imageUri: string): Promise<OCRResult> {
  console.log('[OCR] Starting on-device OCR for platform:', Platform.OS);
  
  if (Platform.OS === 'web') {
    console.log('[OCR] Web platform - OCR not available, user will enter manually');
    return {
      detectedNumber: null,
      allText: [],
      confidence: 0,
    };
  }
  
  // Platform-specific implementations will be loaded dynamically
  // This is handled by React Native's platform-specific file resolution
  // The actual implementation is in ocr.ios.ts and ocr.android.ts
  
  console.log('[OCR] Fallback: No platform-specific OCR available');
  return {
    detectedNumber: null,
    allText: [],
    confidence: 0,
  };
}

/**
 * Check if on-device OCR is available on this platform.
 */
export function isOCRAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
