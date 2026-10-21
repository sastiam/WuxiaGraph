import { describe, it, expect } from 'vitest';
import {
  ChapterSplitter,
  splitChapters,
  calculateWordCount,
  ChapterInputPage,
} from '../../src/domain/ingestion/chapterSplitter.js';

describe('calculateWordCount', () => {
  it('should count English words correctly', () => {
    expect(calculateWordCount('The sacred sword technique of the sect')).toBe(7);
  });

  it('should count Spanish words correctly', () => {
    expect(calculateWordCount('El guerrero caminó hacia la montaña sagrada')).toBe(7);
  });

  it('should count Chinese characters as individual words', () => {
    expect(calculateWordCount('天道觉醒第一章')).toBe(7);
  });

  it('should count mixed CJK and Latin text accurately', () => {
    // "Chapter 1:" (2 words) + "天道觉醒" (4 CJK) = 6
    expect(calculateWordCount('Chapter 1: 天道觉醒')).toBe(6);
  });

  it('should return 0 for empty or whitespace-only text', () => {
    expect(calculateWordCount('')).toBe(0);
    expect(calculateWordCount('   \n\t  ')).toBe(0);
  });
});

describe('ChapterSplitter - Multilingual Header Detection', () => {
  const splitter = new ChapterSplitter();

  it('should detect English chapter headers', () => {
    const text = `
Chapter 1: The Beginning
Meng Zhou was a disciple of the Celestial Sect.

Ch. 2 - The First Trial
He entered the ancient secret realm.

Volume II Chapter 3: Sword Intent
The sword aura filled the heavens.

Book 1 Section 4
Final battle of the realm.
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(4);

    expect(chapters[0].title).toBe('Chapter 1: The Beginning');
    expect(chapters[0].rawContent).toContain('Meng Zhou was a disciple');
    expect(chapters[0].wordCount).toBeGreaterThan(0);

    expect(chapters[1].title).toBe('Ch. 2 - The First Trial');
    expect(chapters[1].rawContent).toContain('ancient secret realm');

    expect(chapters[2].title).toBe('Volume II Chapter 3: Sword Intent');
    expect(chapters[2].rawContent).toContain('sword aura filled');

    expect(chapters[3].title).toBe('Book 1 Section 4');
    expect(chapters[3].rawContent).toContain('Final battle');
  });

  it('should detect Spanish chapter headers', () => {
    const text = `
Capítulo 1: El Despertar
El joven cultivador despertó en el valle sagrado.

Cap. 2: La Espada de Jade
Encontró un arte marital antiguo grabado en piedra.

Tomo I - Capítulo 3: La Batalla
Los clanes rivales atacaron al atardecer.

Volumen II
El viaje hacia el Imperio Central.
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(4);

    expect(chapters[0].title).toBe('Capítulo 1: El Despertar');
    expect(chapters[0].rawContent).toContain('joven cultivador');

    expect(chapters[1].title).toBe('Cap. 2: La Espada de Jade');
    expect(chapters[1].rawContent).toContain('arte marital antiguo');

    expect(chapters[2].title).toBe('Tomo I - Capítulo 3: La Batalla');
    expect(chapters[2].rawContent).toContain('clanes rivales');

    expect(chapters[3].title).toBe('Volumen II');
    expect(chapters[3].rawContent).toContain('Imperio Central');
  });

  it('should detect Chinese chapter headers including numerals and Chinese numbers', () => {
    const text = `
第1章 序幕
天地初开，万物有灵。

第二章 剑宗
孟州踏入了通天峰。

第100回 大结局
一剑破万法，羽化登仙。

序章
风起云涌。
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(4);

    expect(chapters[0].title).toBe('第1章 序幕');
    expect(chapters[0].rawContent).toContain('天地初开');

    expect(chapters[1].title).toBe('第二章 剑宗');
    expect(chapters[1].rawContent).toContain('孟州踏入了通天峰');

    expect(chapters[2].title).toBe('第100回 大结局');
    expect(chapters[2].rawContent).toContain('一剑破万法');

    expect(chapters[3].title).toBe('序章');
    expect(chapters[3].rawContent).toContain('风起云涌');
  });

  it('should detect special named sections like Prologue, Epilogue, Prólogo, Epílogo', () => {
    const text = `
Prologue
Before the war broke out, peace prevailed.

Chapter 1: The Outbreak
The war began at dawn.

Epilogue
Years later, the legend remained.
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(3);

    expect(chapters[0].title).toBe('Prologue');
    expect(chapters[0].rawContent).toContain('Before the war broke out');

    expect(chapters[1].title).toBe('Chapter 1: The Outbreak');
    expect(chapters[1].rawContent).toContain('war began at dawn');

    expect(chapters[2].title).toBe('Epilogue');
    expect(chapters[2].rawContent).toContain('legend remained');
  });

  it('should preserve leading unheaded text as Prologue when first header appears later', () => {
    const text = `
This is introductory text explaining the lore of the world before the main story begins.

Chapter 1: The Awakening
Lin Fan opened his eyes.
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe('Prologue');
    expect(chapters[0].rawContent).toContain('lore of the world');
    expect(chapters[1].title).toBe('Chapter 1: The Awakening');
    expect(chapters[1].rawContent).toContain('Lin Fan opened his eyes');
  });
});

describe('ChapterSplitter - Fallback Mechanisms', () => {
  const splitter = new ChapterSplitter();

  it('should split by stylized separators when no chapter headers are present', () => {
    const text = `
First section of the story without formal headers.
Meng Zhou meditated under the waterfall.

***

Second section after the separator.
He discovered a hidden breakthrough pathway.

===

Third section of the novel.
The heavenly lightning struck the peak.
`;
    const chapters = splitter.split(text);
    expect(chapters).toHaveLength(3);

    expect(chapters[0].title).toBe('Chapter 1');
    expect(chapters[0].rawContent).toContain('under the waterfall');

    expect(chapters[1].title).toBe('Chapter 2');
    expect(chapters[1].rawContent).toContain('breakthrough pathway');

    expect(chapters[2].title).toBe('Chapter 3');
    expect(chapters[2].rawContent).toContain('heavenly lightning');
  });

  it('should fallback to paragraph chunking when no headers or separators exist for long text', () => {
    const paragraph1 = 'Paragraph 1: ' + 'A'.repeat(500);
    const paragraph2 = 'Paragraph 2: ' + 'B'.repeat(500);
    const paragraph3 = 'Paragraph 3: ' + 'C'.repeat(500);

    const fullText = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;

    const chapters = splitter.split(fullText, { fallbackMaxChars: 600 });
    expect(chapters.length).toBeGreaterThanOrEqual(2);
    expect(chapters[0].title).toBe('Section 1');
    expect(chapters[1].title).toBe('Section 2');
  });

  it('should return a single chapter for short text without headers', () => {
    const shortText = 'A single short story without chapter breaks.';
    const chapters = splitter.split(shortText);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe('Section 1');
    expect(chapters[0].rawContent).toBe(shortText);
  });

  it('should return empty array for empty text input', () => {
    expect(splitter.split('')).toEqual([]);
    expect(splitter.split('   \n\t  ')).toEqual([]);
  });
});

describe('ChapterSplitter - Page Mapping and Options', () => {
  it('should correctly map startPage and endPage when input is array of pages', () => {
    const pages: ChapterInputPage[] = [
      {
        pageNumber: 1,
        cleanedText: 'Chapter 1: The Mountain\nMeng Zhou lived in the outer mountain.',
      },
      {
        pageNumber: 2,
        cleanedText: 'He cultivated daily until sunset.\n\nChapter 2: The Cave\nDeep inside the forest, he found a cave.',
      },
      {
        pageNumber: 3,
        cleanedText: 'Inside the cave laid ancient relics.\nHe picked up the jade slip.',
      },
    ];

    const chapters = splitChapters(pages);
    expect(chapters).toHaveLength(2);

    expect(chapters[0].title).toBe('Chapter 1: The Mountain');
    expect(chapters[0].startPage).toBe(1);
    expect(chapters[0].endPage).toBe(2);

    expect(chapters[1].title).toBe('Chapter 2: The Cave');
    expect(chapters[1].startPage).toBe(2);
    expect(chapters[1].endPage).toBe(3);
  });

  it('should support custom header patterns', () => {
    const text = `
EPISODIO 1: El Gran Comienzo
Texto del episodio 1.

EPISODIO 2: La Venganza
Texto del episodio 2.
`;
    const chapters = splitChapters(text, {
      customHeaderPatterns: [/^EPISODIO\s+\d+.*$/i],
    });

    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe('EPISODIO 1: El Gran Comienzo');
    expect(chapters[1].title).toBe('EPISODIO 2: La Venganza');
  });
});
