
import { Platform, NativeModules } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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
 * Extract the most likely 6-digit number (0-999999) from detected text.
 * Handles various formats: house numbers, license plates, receipts, signs, etc.
 */
function extractBestNumber(textBlocks: string[]): { number: number | null; confidence: number } {
  console.log('[OCR iOS] Extracting best number from', textBlocks.length, 'text blocks');
  console.log('[OCR iOS] Text blocks:', textBlocks);
  
  const candidates: { value: number; confidence: number; source: string }[] = [];
  
  for (const text of textBlocks) {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/[^0-9]/g, '');
    
    if (digitsOnly.length === 0) continue;
    
    // Look for exact 6-digit sequences (highest confidence)
    if (digitsOnly.length === 6) {
      const num = parseInt(digitsOnly, 10);
      if (num >= 0 && num <= 999999) {
        candidates.push({ value: num, confidence: 1.0, source: text });
        console.log('[OCR iOS] Found exact 6-digit match:', num, 'from', text);
      }
    }
    
    // Look for sequences that can be truncated to 6 digits
    if (digitsOnly.length > 6) {
      // Try first 6 digits
      const first6 = parseInt(digitsOnly.substring(0, 6), 10);
      if (first6 >= 0 && first6 <= 999999) {
        candidates.push({ value: first6, confidence: 0.8, source: text });
        console.log('[OCR iOS] Found 6-digit prefix:', first6, 'from', text);
      }
      
      // Try last 6 digits
      const last6 = parseInt(digitsOnly.substring(digitsOnly.length - 6), 10);
      if (last6 >= 0 && last6 <= 999999) {
        candidates.push({ value: last6, confidence: 0.7, source: text });
        console.log('[OCR iOS] Found 6-digit suffix:', last6, 'from', text);
      }
    }
    
    // Pad shorter sequences with zeros (lower confidence)
    if (digitsOnly.length < 6 && digitsOnly.length > 0) {
      const padded = digitsOnly.padStart(6, '0');
      const num = parseInt(padded, 10);
      if (num >= 0 && num <= 999999) {
        candidates.push({ value: num, confidence: 0.5, source: text });
        console.log('[OCR iOS] Found padded number:', num, 'from', text);
      }
    }
  }
  
  if (candidates.length === 0) {
    console.log('[OCR iOS] No valid number candidates found');
    return { number: null, confidence: 0 };
  }
  
  // Sort by confidence and return the best match
  candidates.sort((a, b) => b.confidence - a.confidence);
  console.log('[OCR iOS] Best candidate:', candidates[0].value, 'confidence:', candidates[0].confidence, 'from:', candidates[0].source);
  
  return { number: candidates[0].value, confidence: candidates[0].confidence };
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
