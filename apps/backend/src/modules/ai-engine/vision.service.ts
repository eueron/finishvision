import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';

export interface VisionDetection {
  type: string;       // DetectionType value
  label: string;      // human-readable label
  confidence: number; // 0-1
  boundingBox: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, any>;
}

export interface VisionAnalysisResult {
  detections: VisionDetection[];
  sheetType: string;
  summary: string;
  processingMs: number;
}

const DETECTION_PROMPT = `You are an expert architectural blueprint reader specializing in finish carpentry construction documents.

Analyze this blueprint image and detect all construction elements. For each detected element, provide:
1. type: One of: DOOR_SINGLE, DOOR_DOUBLE, DOOR_SLIDING, DOOR_POCKET, DOOR_BIFOLD, DOOR_METAL, WINDOW, CLOSET, CABINET_RUN, ROOM_LABEL, DIMENSION, SCHEDULE_ENTRY, SYMBOL_OTHER
2. label: Human-readable description (e.g., "Interior Single Door 3'-0\"", "Bedroom 1", "Window W-1")
3. confidence: Your confidence level from 0.0 to 1.0
4. boundingBox: Approximate location as {x, y, width, height} in percentage of image dimensions (0-100)
5. metadata: Any additional info (door size, window type, room dimensions, tag number)

Focus on detecting:
- Doors (look for arc symbols, door swings, door tags like D1, D-1)
- Windows (look for parallel lines in walls, window tags like W1)
- Closets (look for shelf/rod symbols, CL labels)
- Cabinet runs (look for counter/cabinet symbols in kitchens/bathrooms)
- Room labels and names
- Key dimensions

Respond ONLY with a valid JSON object in this exact format:
{
  "sheetType": "FLOOR_PLAN" or "DOOR_SCHEDULE" or "WINDOW_SCHEDULE" or "ELEVATION" or "DETAIL" or "OTHER",
  "summary": "Brief description of what this sheet shows",
  "detections": [
    {
      "type": "DOOR_SINGLE",
      "label": "Interior Single Door 3'-0\\"",
      "confidence": 0.92,
      "boundingBox": {"x": 25, "y": 30, "width": 5, "height": 8},
      "metadata": {"tag": "D1", "size": "3'-0\\"", "material": "wood"}
    }
  ]
}`;

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private client: OpenAI;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze a blueprint image using GPT-4.1-mini vision capabilities.
   */
  async analyzeSheet(imagePath: string): Promise<VisionAnalysisResult> {
    this.logger.log(`Starting vision analysis on: ${imagePath}`);
    const startTime = Date.now();

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: DETECTION_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const processingMs = Date.now() - startTime;
      this.logger.log(`Vision analysis completed in ${processingMs}ms`);

      // Parse JSON response
      const parsed = this.parseResponse(content);

      return {
        detections: parsed.detections || [],
        sheetType: parsed.sheetType || 'OTHER',
        summary: parsed.summary || 'Analysis complete',
        processingMs,
      };
    } catch (error: any) {
      this.logger.error(`Vision API error: ${error.message}`);
      // Return empty result on error rather than crashing
      return {
        detections: [],
        sheetType: 'OTHER',
        summary: `Analysis failed: ${error.message}`,
        processingMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse the JSON response from the vision model, handling markdown code blocks.
   */
  private parseResponse(content: string): any {
    // Strip markdown code blocks if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      this.logger.warn(`Failed to parse vision response: ${cleaned.substring(0, 200)}`);
      return { detections: [], sheetType: 'OTHER', summary: 'Parse error' };
    }
  }

  /**
   * Classify a sheet type based on its image content.
   */
  async classifySheet(imagePath: string): Promise<string> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Classify this architectural blueprint sheet. Respond with ONLY one of: FLOOR_PLAN, DOOR_SCHEDULE, WINDOW_SCHEDULE, ELEVATION, DETAIL, COVER, OTHER',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 50,
        temperature: 0,
      });

      const result = response.choices[0]?.message?.content?.trim().toUpperCase() || 'OTHER';
      const validTypes = ['FLOOR_PLAN', 'DOOR_SCHEDULE', 'WINDOW_SCHEDULE', 'ELEVATION', 'DETAIL', 'COVER', 'OTHER'];
      return validTypes.includes(result) ? result : 'OTHER';
    } catch {
      return 'OTHER';
    }
  }
}
