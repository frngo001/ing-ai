import {
  AlignmentType,
  HeadingLevel,
  WidthType,
  ISectionPropertiesOptions,
  PageOrientation,
  IParagraphStyleOptions,
} from 'docx';

/**
 * Word-Formatierungsstile für den DOCX-Export
 */

// Standard-Schriftarten
export const FONTS = {
  default: 'Times New Roman',
  heading: 'Times New Roman',
  code: 'Courier New',
  sans: 'Arial',
} as const;

// Standard-Schriftgrößen (in Half Points)
export const FONT_SIZES = {
  default: 22, // 11pt
  h1: 32, // 16pt
  h2: 28, // 14pt
  h3: 24, // 12pt
  h4: 22, // 11pt
  h5: 20, // 10pt
  h6: 18, // 9pt
  code: 20, // 10pt
} as const;

// Zeilenabstände (in 240ths of a line)
export const LINE_SPACING = {
  single: 240,
  oneAndHalf: 360,
  double: 480,
  default: 240,
} as const;

// Seitenränder (in Twips, 1 inch = 1440 twips)
export const MARGINS = {
  top: 1440, // 1 inch
  right: 1440, // 1 inch
  bottom: 1440, // 1 inch
  left: 1440, // 1 inch
} as const;

/**
 * Word-Styles für Überschriften
 */
export const HEADING_STYLES: Record<string, IParagraphStyleOptions> = {
  heading1: {
    id: 'Heading1',
    name: 'Heading 1',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h1,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 240, // 12pt before
        after: 120, // 6pt after
      },
    },
  },
  heading2: {
    id: 'Heading2',
    name: 'Heading 2',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h2,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 200, // 10pt before
        after: 100, // 5pt after
      },
    },
  },
  heading3: {
    id: 'Heading3',
    name: 'Heading 3',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h3,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 180, // 9pt before
        after: 80, // 4pt after
      },
    },
  },
  heading4: {
    id: 'Heading4',
    name: 'Heading 4',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h4,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 160, // 8pt before
        after: 60, // 3pt after
      },
    },
  },
  heading5: {
    id: 'Heading5',
    name: 'Heading 5',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h5,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 140, // 7pt before
        after: 40, // 2pt after
      },
    },
  },
  heading6: {
    id: 'Heading6',
    name: 'Heading 6',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: FONT_SIZES.h6,
      bold: true,
      font: FONTS.heading,
    },
    paragraph: {
      spacing: {
        before: 120, // 6pt before
        after: 20, // 1pt after
      },
    },
  },
};

/**
 * Standard-Paragraph-Style
 */
export const NORMAL_STYLE: IParagraphStyleOptions = {
  id: 'Normal',
  name: 'Normal',
  run: {
    size: FONT_SIZES.default,
    font: FONTS.default,
  },
  paragraph: {
    spacing: {
      after: 120, // 6pt after
      line: LINE_SPACING.default,
    },
  },
};

/**
 * Code-Block-Style
 */
export const CODE_STYLE: IParagraphStyleOptions = {
  id: 'Code',
  name: 'Code',
  basedOn: 'Normal',
  run: {
    size: FONT_SIZES.code,
    font: FONTS.code,
  },
  paragraph: {
    spacing: {
      after: 80,
    },
    shading: {
      fill: 'F5F5F5',
    },
  },
};

/**
 * Blockquote-Style
 */
export const BLOCKQUOTE_STYLE: IParagraphStyleOptions = {
  id: 'Quote',
  name: 'Quote',
  basedOn: 'Normal',
  paragraph: {
    indent: {
      left: 720, // 0.5 inch
    },
    spacing: {
      before: 120,
      after: 120,
    },
  },
};

/**
 * Bibliographie-Eintrag-Style (hängender Einzug)
 */
export const BIBLIOGRAPHY_STYLE: IParagraphStyleOptions = {
  id: 'Bibliography',
  name: 'Bibliography',
  basedOn: 'Normal',
  paragraph: {
    indent: {
      hanging: 360, // 0.25 inch hanging indent
      left: 360, // 0.25 inch left indent
    },
    spacing: {
      after: 60, // 3pt after
      line: LINE_SPACING.single,
    },
  },
};

/**
 * Standard-Section-Properties (A4, Portrait)
 */
export const DEFAULT_SECTION: ISectionPropertiesOptions = {
  page: {
    size: {
      orientation: PageOrientation.PORTRAIT,
      width: 11906, // A4 width in twips (210mm)
      height: 16838, // A4 height in twips (297mm)
    },
    margin: {
      top: MARGINS.top,
      right: MARGINS.right,
      bottom: MARGINS.bottom,
      left: MARGINS.left,
    },
  },
};

/**
 * Mapping von Heading-Levels zu Word-Heading-Levels
 */
export const HEADING_LEVEL_MAP: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

