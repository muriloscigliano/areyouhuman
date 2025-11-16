import { describe, it, expect } from 'vitest';
import {
  countWords,
  isOnTopic,
  validateResponse,
  truncateToWordLimit,
  generateRedirectMessage,
} from './responseGuardrails';

describe('responseGuardrails', () => {
  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('One two three four five')).toBe(5);
    });

    it('should handle empty strings', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    it('should handle multiple spaces', () => {
      expect(countWords('Hello    world')).toBe(2);
    });

    it('should handle newlines', () => {
      expect(countWords('Hello\nworld\ntest')).toBe(3);
    });
  });

  describe('isOnTopic', () => {
    it('should recognize automation topics', () => {
      expect(isOnTopic('I need help with workflow automation')).toBe(true);
      expect(isOnTopic('Looking for AI solutions')).toBe(true);
      expect(isOnTopic('How can automation improve efficiency?')).toBe(true);
    });

    it('should recognize off-topic content', () => {
      expect(isOnTopic('What is the weather today?')).toBe(false);
      expect(isOnTopic('Best recipe for chocolate cake')).toBe(false);
      expect(isOnTopic('Who won the sports game?')).toBe(false);
    });

    it('should allow short responses', () => {
      // Short responses like "yes", "no", "thanks" should be allowed
      expect(isOnTopic('yes')).toBe(true);
      expect(isOnTopic('thanks')).toBe(true);
      expect(isOnTopic('ok')).toBe(true);
    });

    it('should handle mixed content', () => {
      // If it mentions automation in context of healthcare, should be on-topic
      expect(isOnTopic('We need healthcare automation solutions')).toBe(true);
    });
  });

  describe('validateResponse', () => {
    it('should validate short on-topic responses', () => {
      const result = validateResponse(
        'I can help you automate your workflow and improve efficiency.'
      );
      expect(result.isValid).toBe(true);
      expect(result.isOffTopic).toBe(false);
      expect(result.wordCount).toBeLessThan(20);
    });

    it('should reject off-topic responses', () => {
      const result = validateResponse('The weather is nice today. Let me tell you about recipes.');
      expect(result.isValid).toBe(false);
      expect(result.isOffTopic).toBe(true);
      expect(result.redirectMessage).toBeDefined();
    });

    it('should reject too-long responses', () => {
      const longResponse = 'word '.repeat(250); // 250 words
      const result = validateResponse(longResponse);
      expect(result.isValid).toBe(false);
      expect(result.wordCount).toBeGreaterThan(200);
    });
  });

  describe('truncateToWordLimit', () => {
    it('should not modify text under limit', () => {
      const text = 'This is a short message.';
      const truncated = truncateToWordLimit(text, 100);
      expect(truncated).toBe(text);
    });

    it('should truncate long text', () => {
      const words = Array(300)
        .fill('word')
        .map((w, i) => `${w}${i}`)
        .join(' ');
      const truncated = truncateToWordLimit(words, 200);
      const wordCount = countWords(truncated);
      expect(wordCount).toBeLessThanOrEqual(200);
    });

    it('should preserve sentence endings when possible', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const truncated = truncateToWordLimit(text, 5);
      expect(truncated).toContain('.');
    });

    it('should add ellipsis when cutting mid-sentence', () => {
      const words = Array(300).fill('word').join(' ');
      const truncated = truncateToWordLimit(words, 100);
      expect(truncated).toContain('...');
    });
  });

  describe('generateRedirectMessage', () => {
    it('should return a redirect message', () => {
      const message = generateRedirectMessage();
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(10);
    });

    it('should vary messages (probabilistic test)', () => {
      const messages = new Set();
      for (let i = 0; i < 20; i++) {
        messages.add(generateRedirectMessage());
      }
      // Should have at least 2 different messages in 20 tries
      expect(messages.size).toBeGreaterThanOrEqual(2);
    });
  });
});
