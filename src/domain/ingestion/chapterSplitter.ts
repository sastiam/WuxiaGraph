export interface StructuredChapter {
  chapterIndex: number;
  title: string;
  rawContent: string;
  startPage: number;
  endPage: number;
  wordCount: number;
}

export interface ChapterInputPage {
  pageNumber: number;
  cleanedText: string;
  rawText?: string;
}

export interface ChapterSplitterOptions {
  /**
   * Maximum character length per chunk when falling back to section chunking
   * for documents without formal chapter headers or separators.
   * Default: 8000
   */
  fallbackMaxChars?: number;
  /**
   * Custom regular expressions for custom chapter headers.
   */
  customHeaderPatterns?: RegExp[];
}

/**
 * Standard chapter header regular expressions covering Chinese, English, Spanish,
 * combined Volume/Chapter headers, Roman numerals, and named special sections.
 */
export const DEFAULT_HEADER_PATTERNS: RegExp[] = [
  // Combined Vol/Book/Part + Chapter/Section (e.g., "Vol. 1 Chapter 2", "Volume II Chapter 3", "Book 1 Section 4")
  /^(?:(?:vol(?:ume|\.)?|tomo|book|libro|parte|part)\s*(?:\d+|[ivxlcdm]+)[\s\:-]+)?(?:chapter|ch\.|capítulo|capitulo|cap\.|section|sección|seccion)\s*(?:\d+|[ivxlcdm]+).*$/i,

  // Standalone Chapter / Volume / Book / Section / Tomo / Part (e.g., "Chapter 1", "Ch. 2", "Volume II", "Volumen 3")
  /^(?:chapter|ch\.|capítulo|capitulo|cap\.|book|libro|volume|volumen|vol\.|tomo|part|parte|section|sección|seccion)\s+(?:\d+|[ivxlcdm]+).*$/i,

  // Chinese chapter / section headers (e.g., "第1章", "第一章", "第100回", "第一百卷", "第1节")
  /^(?:第\s*[0-9一二三四五六七八九十百千万]+\s*[章回节卷]|第\s*[0-9一二三四五六七八九十百千万]+\s*卷\s*第\s*[0-9一二三四五六七八九十百千万]+\s*章).*$/i,

  // Named special sections across languages (e.g., "Prologue", "Epilogue", "Prólogo", "序章", "楔子")
  /^(?:prologue|epilogue|interlude|prólogo|prologo|epílogo|epilogo|intermedio|preface|prefacio|introducción|introduccion|序章|序幕|楔子|番外|尾声).*$/i,
];

/**
 * Patterns for stylized section separators when no formal chapter headers exist.
 */
export const STYLIZED_SEPARATOR_PATTERNS: RegExp[] = [
  /^\s*(?:\*\s*\*\s*\*|\*{3,}|-{3,}|={3,}|─{3,}|━{3,}|◆{3,}|◇{3,}|■{3,}|~{3,})\s*$/,
];

/**
 * Calculates word count across multilingual text.
 * CJK characters are counted individually as 1 word each.
 * Non-CJK text is split by whitespace boundaries.
 */
export function calculateWordCount(text: string): number {
  if (!text || !text.trim()) {
    return 0;
  }

  // CJK Unified Ideographs & Kana
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3400-\u4dbf\u3040-\u30ff]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Remove CJK characters to count remaining space-separated words
  const nonCjkText = text.replace(/[\u4e00-\u9fa5\u3400-\u4dbf\u3040-\u30ff]/g, ' ');
  const words = nonCjkText.trim().split(/\s+/).filter((w) => w.length > 0);

  return cjkCount + words.length;
}

interface InternalLineMatch {
  lineIndex: number;
  charOffset: number;
  lineText: string;
  title: string;
}

interface PageSpan {
  pageNumber: number;
  startCharIndex: number;
  endCharIndex: number;
}

export class ChapterSplitter {
  private options: ChapterSplitterOptions;

  constructor(options: ChapterSplitterOptions = {}) {
    this.options = {
      fallbackMaxChars: options.fallbackMaxChars ?? 8000,
      customHeaderPatterns: options.customHeaderPatterns ?? [],
    };
  }

  /**
   * Main entry point to split document content into structured chapters.
   * Accepts either a raw full text string or an array of page objects.
   */
  split(
    input: string | ChapterInputPage[],
    options: ChapterSplitterOptions = {}
  ): StructuredChapter[] {
    const mergedOptions: ChapterSplitterOptions = {
      fallbackMaxChars: options.fallbackMaxChars ?? this.options.fallbackMaxChars,
      customHeaderPatterns: [
        ...(this.options.customHeaderPatterns || []),
        ...(options.customHeaderPatterns || []),
      ],
    };

    let fullText = '';
    let pageSpans: PageSpan[] = [];

    if (typeof input === 'string') {
      fullText = input;
      pageSpans = [{ pageNumber: 1, startCharIndex: 0, endCharIndex: fullText.length }];
    } else {
      let currentOffset = 0;
      const textParts: string[] = [];

      for (const page of input) {
        const text = page.cleanedText ?? page.rawText ?? '';
        textParts.push(text);

        const start = currentOffset;
        currentOffset += text.length;
        const end = currentOffset;

        pageSpans.push({
          pageNumber: page.pageNumber,
          startCharIndex: start,
          endCharIndex: end,
        });

        // Account for separator newline when joining pages
        currentOffset += 1;
      }

      fullText = textParts.join('\n');
    }

    if (!fullText.trim()) {
      return [];
    }

    // 1. Try Regex Header Detection
    const headerMatches = this.detectHeaders(fullText, mergedOptions.customHeaderPatterns);

    if (headerMatches.length > 0) {
      return this.buildChaptersFromMatches(fullText, headerMatches, pageSpans);
    }

    // 2. Try Fallback: Stylized Separator Detection
    const separatorChapters = this.detectStylizedSeparators(fullText, pageSpans);
    if (separatorChapters.length > 0) {
      return separatorChapters;
    }

    // 3. Smart Fallback: Chunking continuous text by paragraph blocks
    return this.fallbackChunking(fullText, pageSpans, mergedOptions.fallbackMaxChars!);
  }

  /**
   * Scans lines of text to identify chapter headers matching regex patterns.
   */
  private detectHeaders(
    fullText: string,
    customPatterns: RegExp[] = []
  ): InternalLineMatch[] {
    const patterns = [...customPatterns, ...DEFAULT_HEADER_PATTERNS];
    const lines = fullText.split('\n');
    const matches: InternalLineMatch[] = [];

    let currentOffset = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmedLine = line.trim();
      const lineOffset = currentOffset;
      currentOffset += line.length + 1; // including \n

      if (!trimmedLine || trimmedLine.length > 150) {
        continue;
      }

      // Check if line matches any header pattern
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(trimmedLine)) {
          matches.push({
            lineIndex: lineIdx,
            charOffset: lineOffset,
            lineText: line,
            title: trimmedLine,
          });
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Constructs structured chapter objects from detected header line matches.
   */
  private buildChaptersFromMatches(
    fullText: string,
    matches: InternalLineMatch[],
    pageSpans: PageSpan[]
  ): StructuredChapter[] {
    const chapters: StructuredChapter[] = [];

    // Check if there is leading text before the first detected chapter match
    if (matches[0].charOffset > 0) {
      const leadingText = fullText.substring(0, matches[0].charOffset).trim();
      if (leadingText.length > 0) {
        const startChar = 0;
        const endChar = matches[0].charOffset;
        chapters.push({
          chapterIndex: 1,
          title: 'Prologue',
          rawContent: leadingText,
          startPage: this.getStartPage(startChar, pageSpans),
          endPage: this.getEndPage(endChar, pageSpans),
          wordCount: calculateWordCount(leadingText),
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];

      const chapterStartOffset = match.charOffset;
      const chapterEndOffset = nextMatch ? nextMatch.charOffset : fullText.length;

      // Extract title and body content
      const chapterFullBlock = fullText.substring(chapterStartOffset, chapterEndOffset);
      const titleLineEnd = chapterFullBlock.indexOf('\n');

      let rawContent = '';
      if (titleLineEnd !== -1) {
        rawContent = chapterFullBlock.substring(titleLineEnd + 1).trim();
      } else {
        rawContent = ''; // Single line chapter header with no body
      }

      chapters.push({
        chapterIndex: chapters.length + 1,
        title: match.title,
        rawContent,
        startPage: this.getStartPage(chapterStartOffset, pageSpans),
        endPage: this.getEndPage(chapterEndOffset, pageSpans),
        wordCount: calculateWordCount(rawContent),
      });
    }

    return chapters;
  }

  /**
   * Secondary fallback: Splits text using stylized separators like ***, ===, ---, etc.
   */
  private detectStylizedSeparators(
    fullText: string,
    pageSpans: PageSpan[]
  ): StructuredChapter[] {
    const lines = fullText.split('\n');
    const separatorIndices: number[] = [];
    const lineOffsets: number[] = [];

    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      lineOffsets.push(currentOffset);
      const trimmed = lines[i].trim();

      for (const pattern of STYLIZED_SEPARATOR_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(trimmed)) {
          separatorIndices.push(i);
          break;
        }
      }

      currentOffset += lines[i].length + 1;
    }

    if (separatorIndices.length === 0) {
      return [];
    }

    const chapters: StructuredChapter[] = [];
    let prevLineIdx = 0;
    let prevOffset = 0;

    for (let i = 0; i <= separatorIndices.length; i++) {
      const isLast = i === separatorIndices.length;
      const endLineIdx = isLast ? lines.length : separatorIndices[i];
      const endOffset = isLast ? fullText.length : lineOffsets[endLineIdx];

      const blockLines = lines.slice(prevLineIdx, endLineIdx);
      const blockText = blockLines.join('\n').trim();

      if (blockText.length > 0) {
        chapters.push({
          chapterIndex: chapters.length + 1,
          title: `Chapter ${chapters.length + 1}`,
          rawContent: blockText,
          startPage: this.getStartPage(prevOffset, pageSpans),
          endPage: this.getEndPage(endOffset, pageSpans),
          wordCount: calculateWordCount(blockText),
        });
      }

      prevLineIdx = endLineIdx + 1;
      prevOffset = endLineIdx + 1 < lineOffsets.length ? lineOffsets[endLineIdx + 1] : fullText.length;
    }

    return chapters;
  }

  /**
   * Final smart fallback: Chunking continuous text into balanced section blocks by paragraph breaks.
   */
  private fallbackChunking(
    fullText: string,
    pageSpans: PageSpan[],
    maxChars: number
  ): StructuredChapter[] {
    const trimmed = fullText.trim();
    if (trimmed.length <= maxChars) {
      return [
        {
          chapterIndex: 1,
          title: 'Section 1',
          rawContent: trimmed,
          startPage: this.getStartPage(0, pageSpans),
          endPage: this.getEndPage(fullText.length, pageSpans),
          wordCount: calculateWordCount(trimmed),
        },
      ];
    }

    const paragraphs = fullText.split(/\n\s*\n/);
    const chapters: StructuredChapter[] = [];

    let currentChunk: string[] = [];
    let currentLength = 0;
    let chunkStartOffset = 0;
    let runningOffset = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const paraLen = para.length;

      if (currentChunk.length > 0 && currentLength + paraLen > maxChars) {
        const rawContent = currentChunk.join('\n\n').trim();
        const chunkEndOffset = runningOffset;

        chapters.push({
          chapterIndex: chapters.length + 1,
          title: `Section ${chapters.length + 1}`,
          rawContent,
          startPage: this.getStartPage(chunkStartOffset, pageSpans),
          endPage: this.getEndPage(chunkEndOffset, pageSpans),
          wordCount: calculateWordCount(rawContent),
        });

        currentChunk = [para];
        currentLength = paraLen;
        chunkStartOffset = runningOffset;
      } else {
        currentChunk.push(para);
        currentLength += paraLen;
      }

      runningOffset += paraLen + 2; // accounting for \n\n
    }

    if (currentChunk.length > 0) {
      const rawContent = currentChunk.join('\n\n').trim();
      chapters.push({
        chapterIndex: chapters.length + 1,
        title: `Section ${chapters.length + 1}`,
        rawContent,
        startPage: this.getStartPage(chunkStartOffset, pageSpans),
        endPage: this.getEndPage(fullText.length, pageSpans),
        wordCount: calculateWordCount(rawContent),
      });
    }

    return chapters;
  }

  private getStartPage(charOffset: number, pageSpans: PageSpan[]): number {
    if (pageSpans.length === 0) return 1;
    const found = pageSpans.find((span) => charOffset >= span.startCharIndex && charOffset <= span.endCharIndex);
    return found ? found.pageNumber : pageSpans[0].pageNumber;
  }

  private getEndPage(charOffset: number, pageSpans: PageSpan[]): number {
    if (pageSpans.length === 0) return 1;
    const clampedOffset = Math.max(0, charOffset - 1);
    const found = pageSpans.find((span) => clampedOffset >= span.startCharIndex && clampedOffset <= span.endCharIndex);
    return found ? found.pageNumber : pageSpans[pageSpans.length - 1].pageNumber;
  }
}

/**
 * Convenience helper function to split text or pages into structured chapters.
 */
export function splitChapters(
  input: string | ChapterInputPage[],
  options: ChapterSplitterOptions = {}
): StructuredChapter[] {
  const splitter = new ChapterSplitter(options);
  return splitter.split(input, options);
}
