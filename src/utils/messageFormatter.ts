/**
 * Message Formatter Utility
 * High-performance message formatting with pre-compiled regex patterns
 * Replaces the expensive computed property in AiMessage.vue
 */

// =============================================================================
// PRE-COMPILED REGEX PATTERNS (created once, reused always)
// =============================================================================

const PATTERNS = {
  // Markdown patterns
  bold: /\*\*(.+?)\*\*/g,
  italic: /\*([^*]+)\*/g,
  italicExample: /\*\(([^)]+)\)\*/g,

  // Bullet list detection
  bulletLine: /^[\*\-\•]\s+/,
  bulletLineGlobal: /^[\*\-\•]\s+(.*)$/gm,

  // Question detection
  questionAfterPunctuation: /([.!])\s+([A-Z][^?!\n]*\?)(?![^<]*<\/strong>)/g,
  questionAtLineStart: /^([A-Z][^?!\n]*\?)(?![^<]*<\/strong>)/gm,
  boldQuestion: /\*\*([^*]+\?)\*\*/g,

  // Name detection
  greetingWithName: /(Thanks,|Hi|Hey|Hello|Hi there,)\s+([A-Z][a-z]{2,})\b/gi,
  humanWord: /\b(Human)\b/gi,
  capitalizedName: /\b([A-Z][a-z]{3,})\b/g,

  // Paragraph handling
  paragraphBreak: /\n\n+/,
  singleNewline: /\n(?!<[ul])/g,

  // Cleanup
  multipleSpaces: /\s+/g,
  brBeforeStrong: /<br\s*\/?>\s*<strong>/g,
} as const;

// Words to skip when bolding names
const SKIP_WORDS = new Set([
  'The', 'This', 'That', 'What', 'Where', 'When', 'Why', 'How', 'Who', 'Which',
  'Good', 'Great', 'Perfect', 'Thanks', 'Got', 'Now', 'Ready', 'Before', 'After',
  'About', 'With', 'From', 'Your', 'You', 'Our', 'Their', 'There', 'These', 'Those',
  'Want', 'Looking', 'Trying', 'Working', 'Building', 'Creating', 'Developing',
  'Should', 'Could', 'Would', 'Will', 'Can', 'May', 'Might', 'Here', 'Just',
  'Also', 'Even', 'Still', 'Already', 'Always', 'Never', 'Often', 'Sometimes',
  'Please', 'Sure', 'Okay', 'Right', 'Well', 'Very', 'Really', 'Quite',
]);

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format a bot message with markdown-like styling
 * Optimized for performance with pre-compiled patterns
 *
 * @param message - Raw message text
 * @returns Formatted HTML string
 */
export function formatBotMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '<p></p>';
  }

  let formatted = message.trim();

  // Step 1: Process bullet lists
  formatted = processBulletLists(formatted);

  // Step 2: Process italic examples like *(e.g., ...)*
  formatted = processItalicExamples(formatted);

  // Step 3: Process bold text
  formatted = processBoldText(formatted);

  // Step 4: Bold questions
  formatted = processQuestions(formatted);

  // Step 5: Bold special words (Human, names)
  formatted = processSpecialWords(formatted);

  // Step 6: Handle paragraphs and line breaks
  formatted = processParagraphs(formatted);

  return formatted;
}

/**
 * Process bullet lists (lines starting with *, -, or •)
 */
function processBulletLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isBullet = PATTERNS.bulletLine.test(line) && !line.startsWith('*(');
    const nextLine = lines[i + 1]?.trim() || '';
    const nextIsBullet = PATTERNS.bulletLine.test(nextLine) && !nextLine.startsWith('*(');

    if (isBullet) {
      if (!inList) {
        result.push('<ul class="message__list">');
        inList = true;
      }
      const listItem = line.replace(PATTERNS.bulletLine, '');
      result.push(`<li>${listItem}</li>`);

      if (!nextIsBullet) {
        result.push('</ul>');
        inList = false;
      }
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * Process italic examples like *(e.g., item1, item2)*
 */
function processItalicExamples(text: string): string {
  return text.replace(PATTERNS.italicExample, (_match, content: string) => {
    if (content.includes(',')) {
      // Multiple examples - create bullet list
      const items = content
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Remove "e.g.," prefix from first item
      if (items[0]) {
        items[0] = items[0].replace(/^e\.g\.?\s*,?\s*/i, '');
      }

      const listItems = items
        .map((item) => `<li>${capitalizeFirst(item)}</li>`)
        .join('');

      return `<ul class="message__example-list">${listItems}</ul>`;
    } else {
      // Single example - keep as italic
      return `<em class="message__example">(${content})</em>`;
    }
  });
}

/**
 * Process **bold** markdown
 */
function processBoldText(text: string): string {
  return text.replace(PATTERNS.bold, '<strong>$1</strong>');
}

/**
 * Process questions and make them bold
 */
function processQuestions(text: string): string {
  // Bold questions after sentence endings
  text = text.replace(PATTERNS.questionAfterPunctuation, (match, punct, question) => {
    if (match.includes('<li>') || match.includes('<strong>')) {
      return match;
    }
    return `${punct} <strong>${question.trim()}</strong>`;
  });

  return text;
}

/**
 * Process special words (Human, names after greetings)
 */
function processSpecialWords(text: string): string {
  // Bold "Human"
  text = text.replace(PATTERNS.humanWord, (match, word, offset, string) => {
    if (isInsideTag(string, offset)) {
      return match;
    }
    return `<strong>${word}</strong>`;
  });

  // Bold names after greetings
  text = text.replace(PATTERNS.greetingWithName, (match, greeting, name, offset, string) => {
    if (isInsideTag(string, offset)) {
      return match;
    }
    return `${greeting} <strong>${name}</strong>`;
  });

  // Bold standalone capitalized names
  text = text.replace(PATTERNS.capitalizedName, (match, name, offset, string) => {
    if (SKIP_WORDS.has(name)) {
      return match;
    }
    if (isInsideTag(string, offset)) {
      return match;
    }
    // Check if at start of sentence
    const prevChar = offset > 0 ? string[offset - 1] : '';
    if (prevChar === '.' || prevChar === '!' || prevChar === '?') {
      return match;
    }
    return `<strong>${name}</strong>`;
  });

  return text;
}

/**
 * Process paragraphs and line breaks
 */
function processParagraphs(text: string): string {
  const hasParagraphBreaks = PATTERNS.paragraphBreak.test(text);

  if (hasParagraphBreaks) {
    const paragraphs = text.split(PATTERNS.paragraphBreak).filter((p) => p.trim());
    return paragraphs
      .map((p) => {
        p = p.replace(PATTERNS.singleNewline, '<br />');
        return `<p>${p}</p>`;
      })
      .join('');
  } else {
    text = text.replace(PATTERNS.singleNewline, '<br />');
    return `<p>${text}</p>`;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a position is inside an HTML tag
 */
function isInsideTag(str: string, offset: number): boolean {
  const before = str.substring(Math.max(0, offset - 50), offset);
  return /<[^>]*$/.test(before) || (before.includes('<strong>') && !before.includes('</strong>'));
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Truncate text to a maximum word count
 */
export function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  const truncated = words.slice(0, maxWords).join(' ');

  // Try to end on a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

  if (lastSentenceEnd > truncated.length * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1).trim();
  }

  return truncated.trim() + '...';
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
