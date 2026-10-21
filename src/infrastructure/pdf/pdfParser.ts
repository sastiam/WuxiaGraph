import { PDFParse } from 'pdf-parse';
import fs from 'node:fs';

export interface ParsedChapter {
  chapterIndex: number;
  title: string;
  content: string;
}

export interface ParsedPdfPage {
  pageNumber: number;
  rawText: string;
  cleanedText: string;
}

export interface PdfParseResult {
  totalPages: number;
  text: string;
  pages: ParsedPdfPage[];
  chapters: ParsedChapter[];
}

export interface PdfCleanerOptions {
  /**
   * Additional custom patterns or strings to clean as watermarks or unwanted boilerplate.
   */
  customWatermarks?: Array<string | RegExp>;
  /**
   * Whether to strip common page number footers (e.g., "-- 1 of 1 --", "Page 1", "Página 1 de 10").
   * Default: true
   */
  removePageNumbers?: boolean;
  /**
   * Whether to strip common scan/web novel watermark lines.
   * Default: true
   */
  removeCommonWatermarks?: boolean;
}

export interface PdfParserOptions extends PdfCleanerOptions {}

/**
 * Standard watermark and header/footer expressions common across light novel / wuxia rips,
 * scans, pirated distributions, and digital print headers.
 */
export const DEFAULT_WATERMARK_PATTERNS: RegExp[] = [
  // Page number footers like "-- 1 of 1 --", "- 12 -", "Page 1 of 50", "Página 3", "第 1 页"
  /^\s*(?:--\s*\d+\s*(?:of|\/)\s*\d+\s*--|-+\s*\d+\s*-+|page\s+\d+(?:\s*(?:of|\/)\s*\d+)?|página\s+\d+(?:\s*(?:de|\/)\s*\d+)?|第\s*\d+\s*[页頁])\s*$/gim,
  // URL watermarks (e.g. www.wuxiaworld.com, https://novelcool.com)
  /^\s*(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\s*$/gim,
  // Common novel translation / distribution site disclaimers and tags
  /^\s*(?:novelhall|readnovelfull|wuxiaworld|webnovel|royalroad|freewebnovel|boxnovel|novelfull)\s*.*$/gim,
  // Common OCR/PDF header/footer marks
  /^\s*(?:downloaded from|translated by|scanned by|hosted at|posted at)\s*:.+$/gim,
  /^\s*(?:watermark|confidential|draft|internal use only)\s*$/gim,
];

/**
 * Cleans extracted PDF text by removing watermarks, header/footer noise, and normalizing line breaks.
 */
export function cleanWatermarks(rawText: string, options: PdfCleanerOptions = {}): string {
  if (!rawText) {
    return '';
  }

  const {
    customWatermarks = [],
    removePageNumbers = true,
    removeCommonWatermarks = true,
  } = options;

  const lines = rawText.split(/\r?\n/);
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return true; // Keep empty lines for paragraph separation during line filter
    }

    if (removeCommonWatermarks) {
      for (const pattern of DEFAULT_WATERMARK_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(trimmed)) {
          return false;
        }
      }
    }

    if (removePageNumbers) {
      // Standalone numbers as page numbers (e.g. isolated "1", "42")
      if (/^\d{1,4}$/.test(trimmed)) {
        return false;
      }
    }

    for (const custom of customWatermarks) {
      if (typeof custom === 'string') {
        if (trimmed.toLowerCase().includes(custom.toLowerCase())) {
          return false;
        }
      } else {
        custom.lastIndex = 0;
        if (custom.test(trimmed)) {
          return false;
        }
      }
    }

    return true;
  });

  return filteredLines
    .join('\n')
    // Collapse excessive blank lines (more than 2 consecutive newlines) into double newline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class PdfParserService {
  /**
   * Parses a PDF file from disk or Uint8Array and extracts structured pages, clean text, and chapters.
   */
  async parsePdf(
    input: string | Uint8Array | Buffer,
    options: PdfParserOptions = {}
  ): Promise<PdfParseResult> {
    let uint8Array: Uint8Array;

    if (typeof input === 'string') {
      if (!fs.existsSync(input)) {
        throw new Error(`PDF file not found: ${input}`);
      }
      const buffer = fs.readFileSync(input);
      uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else if (input instanceof Uint8Array && !(input instanceof Buffer)) {
      uint8Array = input;
    } else {
      // Handles Node.js Buffer or other Uint8Array subclasses
      uint8Array = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    const parser = new PDFParse(uint8Array);
    const parsedData = await parser.getText({ pageJoiner: '' });

    const rawPages = parsedData.pages || [];
    const pages: ParsedPdfPage[] = rawPages.map((page) => {
      const pageText = page.text || '';
      return {
        pageNumber: page.num,
        rawText: pageText,
        cleanedText: cleanWatermarks(pageText, options),
      };
    });

    const fullCleanedText = pages.length > 0
      ? cleanWatermarks(pages.map((p) => p.cleanedText).filter(Boolean).join('\n\n'), options)
      : cleanWatermarks(parsedData.text || '', options);

    const totalPages = parsedData.total || pages.length || 1;
    const chapters = this.extractChapters(fullCleanedText);

    return {
      totalPages,
      text: fullCleanedText,
      pages,
      chapters,
    };
  }

  /**
   * Helper to detect and segment novel chapters from extracted text.
   */
  extractChapters(text: string): ParsedChapter[] {
    const chapterRegex = /(?:^|\n)(Chapter\s+\d+.*|Capítulo\s+\d+.*|Capitulo\s+\d+.*|第[一二三四五六七八九十0-9]+章[^\n]*)(?=\n|$)/gi;
    const matches = Array.from(text.matchAll(chapterRegex));

    if (matches.length === 0) {
      const trimmed = text.trim();
      return trimmed.length > 0
        ? [
            {
              chapterIndex: 1,
              title: 'Section 1',
              content: trimmed,
            },
          ]
        : [];
    }

    const chapters: ParsedChapter[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[1].trim();
      const startIndex = match.index! + match[0].indexOf(match[1]);

      const nextMatch = matches[i + 1];
      const endIndex = nextMatch
        ? nextMatch.index! + nextMatch[0].indexOf(nextMatch[1])
        : text.length;

      const content = text.substring(startIndex + match[1].length, endIndex).trim();

      chapters.push({
        chapterIndex: i + 1,
        title,
        content,
      });
    }

    return chapters;
  }
}
