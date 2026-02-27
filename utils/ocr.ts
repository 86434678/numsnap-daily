
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
 * Extract the most likely 6-digit number (0-999999) from detected text.
 * Handles >6 digit numbers by prioritizing first 6 digits.
 */
export function extractBestNumber(textBlocks: string[]): { number: number | null; confidence: number } {
  console.log('[OCR] Extracting best number from', textBlocks.length, 'text blocks');
  console.log('[OCR] Text blocks:', textBlocks);
  
  const candidates: { value: number; confidence: number; source: string }[] = [];
  
  for (const text of textBlocks) {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/[^0-9]/g, '');
    
    if (digitsOnly.length === 0) continue;
    
    console.log('[OCR] Raw digits:', digitsOnly);
    
    // Look for exact 6-digit sequences (highest confidence)
    if (digitsOnly.length === 6) {
      const num = parseInt(digitsOnly, 10);
      if (num >= 0 && num <= 999999) {
        candidates.push({ value: num, confidence: 1.0, source: text });
        console.log('[OCR] Found exact 6-digit match:', num, 'from', text);
        console.log('[OCR] Selected:', num);
      }
    }
    
    // If >6 digits, prioritize FIRST 6 digits (high confidence 0.9)
    if (digitsOnly.length > 6) {
      const first6 = parseInt(digitsOnly.substring(0, 6), 10);
      if (first6 >= 0 && first6 <= 999999) {
        candidates.push({ value: first6, confidence: 0.9, source: text });
        console.log('[OCR] Found >6 digits - taking FIRST 6:', first6, 'from', text);
        console.log('[OCR] Selected:', first6);
      }
      
      // Keep last 6 as lower-confidence fallback (0.7)
      const last6 = parseInt(digitsOnly.substring(digitsOnly.length - 6), 10);
      if (last6 >= 0 && last6 <= 999999) {
        candidates.push({ value: last6, confidence: 0.7, source: text });
        console.log('[OCR] Also found LAST 6 (fallback):', last6, 'from', text);
      }
    }
    
    // Pad shorter sequences with zeros (lower confidence)
    if (digitsOnly.length < 6 && digitsOnly.length > 0) {
      const padded = digitsOnly.padStart(6, '0');
      const num = parseInt(padded, 10);
      if (num >= 0 && num <= 999999) {
        candidates.push({ value: num, confidence: 0.5, source: text });
        console.log('[OCR] Found padded number:', num, 'from', text);
        console.log('[OCR] Selected:', num);
      }
    }
  }
  
  if (candidates.length === 0) {
    console.log('[OCR] No valid number candidates found');
    return { number: null, confidence: 0 };
  }
  
  // Sort by confidence and return the best match
  candidates.sort((a, b) => b.confidence - a.confidence);
  console.log('[OCR] Best candidate:', candidates[0].value, 'confidence:', candidates[0].confidence, 'from:', candidates[0].source);
  
  return { number: candidates[0].value, confidence: candidates[0].confidence };
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
  
  // Dynamically import platform-specific implementation
  try {
    if (Platform.OS === 'ios') {
      const { performOCR: iosOCR } = await import('./ocr.ios');
      return await iosOCR(imageUri);
    } else if (Platform.OS === 'android') {
      const { performOCR: androidOCR } = await import('./ocr.android');
      return await androidOCR(imageUri);
    }
  } catch (error) {
    console.error('[OCR] Error loading platform-specific OCR:', error);
  }
  
  // Fallback if platform-specific implementation fails
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
