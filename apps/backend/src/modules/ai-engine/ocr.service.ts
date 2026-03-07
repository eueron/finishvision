import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';

export interface OcrResult {
  fullText: string;
  roomNames: string[];
  dimensions: string[];
  doorTags: string[];
  windowTags: string[];
  annotations: string[];
  confidence: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Run OCR on a sheet image and extract structured text.
   */
  async processImage(imagePath: string): Promise<OcrResult> {
    this.logger.log(`Starting OCR on: ${imagePath}`);

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    const startTime = Date.now();

    const { data } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.logger.debug(`OCR progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    const elapsed = Date.now() - startTime;
    this.logger.log(`OCR completed in ${elapsed}ms, confidence: ${data.confidence}%`);

    const fullText = data.text;

    // Extract structured data from OCR text
    const roomNames = this.extractRoomNames(fullText);
    const dimensions = this.extractDimensions(fullText);
    const doorTags = this.extractDoorTags(fullText);
    const windowTags = this.extractWindowTags(fullText);
    const annotations = this.extractAnnotations(fullText);

    return {
      fullText,
      roomNames,
      dimensions,
      doorTags,
      windowTags,
      annotations,
      confidence: data.confidence / 100,
    };
  }

  /**
   * Extract room names from OCR text.
   * Common patterns: "BEDROOM 1", "MASTER BATH", "KITCHEN", "LIVING ROOM"
   */
  private extractRoomNames(text: string): string[] {
    const roomPatterns = [
      /\b(MASTER\s+)?BED(?:ROOM)?\s*\d*/gi,
      /\b(MASTER\s+)?BATH(?:ROOM)?\s*\d*/gi,
      /\bKITCHEN\b/gi,
      /\bLIVING\s*(?:ROOM)?\b/gi,
      /\bDINING\s*(?:ROOM)?\b/gi,
      /\bFAMILY\s*(?:ROOM)?\b/gi,
      /\bLAUNDRY\b/gi,
      /\bGARAGE\b/gi,
      /\bCLOSET\b/gi,
      /\bWALK[\s-]?IN\s*CLOSET\b/gi,
      /\bPANTRY\b/gi,
      /\bFOYER\b/gi,
      /\bENTRY\b/gi,
      /\bHALL(?:WAY)?\b/gi,
      /\bOFFICE\b/gi,
      /\bDEN\b/gi,
      /\bBONUS\s*(?:ROOM)?\b/gi,
      /\bUTILITY\b/gi,
      /\bMUD\s*ROOM\b/gi,
      /\bSUNROOM\b/gi,
      /\bPORCH\b/gi,
      /\bPATIO\b/gi,
      /\bBALCONY\b/gi,
    ];

    const found = new Set<string>();
    for (const pattern of roomPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((m) => found.add(m.trim().toUpperCase()));
      }
    }
    return Array.from(found);
  }

  /**
   * Extract dimensions from OCR text.
   * Common patterns: "12'-6\"", "10'0\"", "3'-4 1/2\"", "12x14"
   */
  private extractDimensions(text: string): string[] {
    const dimPatterns = [
      /\d+['′]\s*-?\s*\d+(?:\s*\d+\/\d+)?["″]?/g,   // 12'-6", 10'0"
      /\d+['′]\s*\d*["″]/g,                            // 12'6"
      /\d+\s*(?:ft|feet)\s*\d*\s*(?:in|inches)?/gi,    // 12 ft 6 in
      /\d+\s*x\s*\d+/g,                                 // 12x14
      /\d+'-\d+\s*\d*\/\d*/g,                           // 3'-4 1/2
    ];

    const found = new Set<string>();
    for (const pattern of dimPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((m) => found.add(m.trim()));
      }
    }
    return Array.from(found);
  }

  /**
   * Extract door tags from OCR text.
   * Common patterns: "D1", "D-1", "DOOR 101", "DR-1"
   */
  private extractDoorTags(text: string): string[] {
    const patterns = [
      /\bD[\s-]?\d+[A-Z]?\b/gi,
      /\bDR[\s-]?\d+[A-Z]?\b/gi,
      /\bDOOR\s*\d+[A-Z]?\b/gi,
    ];

    const found = new Set<string>();
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((m) => found.add(m.trim().toUpperCase()));
      }
    }
    return Array.from(found);
  }

  /**
   * Extract window tags from OCR text.
   * Common patterns: "W1", "W-1", "WIN 101", "WN-1"
   */
  private extractWindowTags(text: string): string[] {
    const patterns = [
      /\bW[\s-]?\d+[A-Z]?\b/gi,
      /\bWN[\s-]?\d+[A-Z]?\b/gi,
      /\bWIN(?:DOW)?\s*\d+[A-Z]?\b/gi,
    ];

    const found = new Set<string>();
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((m) => found.add(m.trim().toUpperCase()));
      }
    }
    return Array.from(found);
  }

  /**
   * Extract general annotations from OCR text.
   */
  private extractAnnotations(text: string): string[] {
    const patterns = [
      /\bNOTE:?\s*.+/gi,
      /\bTYP\.?\b/gi,
      /\bSIM\.?\b/gi,
      /\bEQ\.?\b/gi,
      /\bVERIFY\b.*/gi,
      /\bSEE\s+(?:DETAIL|DWG|SHEET)\b.*/gi,
    ];

    const found: string[] = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((m) => found.push(m.trim()));
      }
    }
    return found;
  }
}
