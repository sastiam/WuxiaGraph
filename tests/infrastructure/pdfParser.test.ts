import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  PdfParserService,
  cleanWatermarks,
  DEFAULT_WATERMARK_PATTERNS,
} from '../../src/infrastructure/pdf/pdfParser.js';

describe('cleanWatermarks', () => {
  it('should remove common page number watermarks like "-- 1 of 1 --" and standalone page numbers', () => {
    const raw = `
Chapter 1: The Beginning
Some narrative text about cultivation.
-- 1 of 1 --
-- 2 / 10 --
Page 15 of 200
Página 4 de 10
42
More sacred martial arts lore.
`;
    const cleaned = cleanWatermarks(raw);
    expect(cleaned).not.toContain('-- 1 of 1 --');
    expect(cleaned).not.toContain('-- 2 / 10 --');
    expect(cleaned).not.toContain('Page 15 of 200');
    expect(cleaned).not.toContain('Página 4 de 10');
    expect(cleaned).not.toMatch(/^42$/m);
    expect(cleaned).toContain('Chapter 1: The Beginning');
    expect(cleaned).toContain('Some narrative text about cultivation.');
    expect(cleaned).toContain('More sacred martial arts lore.');
  });

  it('should remove translation site watermarks and domain URLs', () => {
    const raw = `
Title: Peerless Martial God
https://www.wuxiaworld.com
Downloaded from: NovelUpdates
ReadNovelFull - Free novel reader
RoyalRoad latest release
Confidential
Lin Feng stepped into the arena.
`;
    const cleaned = cleanWatermarks(raw);
    expect(cleaned).not.toContain('wuxiaworld.com');
    expect(cleaned).not.toContain('NovelUpdates');
    expect(cleaned).not.toContain('ReadNovelFull');
    expect(cleaned).not.toContain('RoyalRoad');
    expect(cleaned).not.toContain('Confidential');
    expect(cleaned).toContain('Lin Feng stepped into the arena.');
  });

  it('should support custom watermark patterns and strings', () => {
    const raw = `
Chapter 5: Sword Intent
STOLEN NOVEL WATERMARK - DO NOT COPY
Meng Zhou swung his blade.
[Pirated by EvilSect]
`;
    const cleaned = cleanWatermarks(raw, {
      customWatermarks: [
        'STOLEN NOVEL WATERMARK',
        /\[Pirated by [^\]]+\]/i,
      ],
    });
    expect(cleaned).not.toContain('STOLEN NOVEL WATERMARK');
    expect(cleaned).not.toContain('EvilSect');
    expect(cleaned).toContain('Chapter 5: Sword Intent');
    expect(cleaned).toContain('Meng Zhou swung his blade.');
  });

  it('should return empty string when empty text is provided', () => {
    expect(cleanWatermarks('')).toBe('');
  });
});

describe('PdfParserService', () => {
  const fixturePath = path.resolve(__dirname, '../fixtures/sample-book.pdf');
  let pdfParser: PdfParserService;

  beforeAll(() => {
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Test fixture missing at ${fixturePath}`);
    }
    pdfParser = new PdfParserService();
  });

  it('should parse real PDF fixture file and extract clean text and structured pages', async () => {
    const result = await pdfParser.parsePdf(fixturePath);

    expect(result.totalPages).toBeGreaterThanOrEqual(1);
    expect(result.text).toContain('Celestial Sword Sect');
    expect(result.text).not.toContain('-- 1 of 1 --');

    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].cleanedText).toContain('Celestial Sword Sect');
    expect(result.pages[0].cleanedText).not.toContain('-- 1 of 1 --');

    expect(result.chapters.length).toBeGreaterThanOrEqual(1);
    expect(result.chapters[0].title).toContain('Chapter 1');
    expect(result.chapters[0].content).toContain('Meng Zhou');
    expect(result.chapters[0].content).not.toContain('-- 1 of 1 --');
  });

  it('should parse PDF from Uint8Array directly', async () => {
    const buffer = fs.readFileSync(fixturePath);
    const uint8 = new Uint8Array(buffer);
    const result = await pdfParser.parsePdf(uint8);

    expect(result.totalPages).toBeGreaterThanOrEqual(1);
    expect(result.text).toContain('Celestial Sword Sect');
    expect(result.chapters.length).toBe(1);
  });

  it('should throw an error for non-existent PDF file', async () => {
    await expect(
      pdfParser.parsePdf('/invalid/path/nonexistent.pdf')
    ).rejects.toThrow('PDF file not found');
  });

  it('should filter watermarks per page when custom watermarks are configured', async () => {
    const buffer = fs.readFileSync(fixturePath);
    const result = await pdfParser.parsePdf(new Uint8Array(buffer), {
      customWatermarks: ['Heavenly Demon Clan'],
    });

    expect(result.text).not.toContain('Heavenly Demon Clan');
    expect(result.text).toContain('Senior Brother Meng Zhou');
  });

  it('should extract multilingual chapters (Spanish, Chinese, English)', () => {
    const sampleText = `
Chapter 1: The Mountain
First line of chapter 1.

Capítulo 2: El Despertar
Segunda línea del capítulo 2.

第3章 天道觉醒
第三行内容。
`;
    const chapters = pdfParser.extractChapters(sampleText);
    expect(chapters.length).toBe(3);
    expect(chapters[0].title).toBe('Chapter 1: The Mountain');
    expect(chapters[0].content).toContain('First line of chapter 1.');
    expect(chapters[1].title).toBe('Capítulo 2: El Despertar');
    expect(chapters[1].content).toContain('Segunda línea del capítulo 2.');
    expect(chapters[2].title).toBe('第3章 天道觉醒');
    expect(chapters[2].content).toContain('第三行内容。');
  });
});
