import { describe, it, expect } from 'vitest';
import {
  countTokens,
  trimConversation,
  limitMessageLength,
  needsSummarization,
  createConversationSummary,
  getTokenStats,
} from './tokenManager';
import type { Message } from '../types';

describe('tokenManager', () => {
  describe('countTokens', () => {
    it('should count tokens in a string', () => {
      const text = 'Hello world, this is a test message';
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length); // Tokens should be less than character count
    });

    it('should handle empty strings', () => {
      const tokens = countTokens('');
      expect(tokens).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'word '.repeat(100);
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThan(50);
    });
  });

  describe('trimConversation', () => {
    const messages: Message[] = [
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' },
      { role: 'assistant', content: 'Second response' },
      { role: 'user', content: 'Third message' },
      { role: 'assistant', content: 'Third response' },
    ];

    it('should keep all messages if under limit', () => {
      const trimmed = trimConversation(messages, 10000);
      expect(trimmed.length).toBe(messages.length);
    });

    it('should trim oldest messages first', () => {
      const trimmed = trimConversation(messages, 20);
      expect(trimmed.length).toBeLessThan(messages.length);
      expect(trimmed[trimmed.length - 1].content).toBe('Third response');
    });

    it('should return empty array if max is 0', () => {
      const trimmed = trimConversation(messages, 0);
      expect(trimmed.length).toBe(0);
    });

    it('should handle empty message array', () => {
      const trimmed = trimConversation([], 100);
      expect(trimmed.length).toBe(0);
    });
  });

  describe('limitMessageLength', () => {
    it('should not modify messages under limit', () => {
      const message = 'Short message';
      const limited = limitMessageLength(message, 500);
      expect(limited).toBe(message);
    });

    it('should truncate messages over limit', () => {
      const message = 'a'.repeat(600);
      const limited = limitMessageLength(message, 500);
      expect(limited.length).toBe(500);
    });

    it('should use default limit of 500', () => {
      const message = 'a'.repeat(600);
      const limited = limitMessageLength(message);
      expect(limited.length).toBe(500);
    });
  });

  describe('needsSummarization', () => {
    it('should return false for short conversations', () => {
      const messages: Message[] = [
        { role: 'user', content: 'test' },
        { role: 'assistant', content: 'response' },
      ];
      expect(needsSummarization(messages)).toBe(false);
    });

    it('should return true for 20 messages', () => {
      const messages: Message[] = Array(20)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
          content: `Message ${i}`,
        }));
      expect(needsSummarization(messages)).toBe(true);
    });

    it('should return false for 19 messages', () => {
      const messages: Message[] = Array(19)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
          content: `Message ${i}`,
        }));
      expect(needsSummarization(messages)).toBe(false);
    });
  });

  describe('createConversationSummary', () => {
    it('should create a summary with basic info', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello, I need help with automation' },
        { role: 'assistant', content: 'Happy to help!' },
        { role: 'user', content: 'My email is test@example.com' },
      ];
      const summary = createConversationSummary(messages);
      expect(summary).toContain('Initial request');
      expect(summary).toContain('Total exchanges');
    });

    it('should detect contact info', () => {
      const messages: Message[] = [
        { role: 'user', content: 'My email is contact@company.com' },
        { role: 'assistant', content: 'Thank you!' },
      ];
      const summary = createConversationSummary(messages);
      expect(summary).toContain('Contact information collected');
    });
  });

  describe('getTokenStats', () => {
    it('should calculate token statistics', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello world' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const stats = getTokenStats(messages);

      expect(stats.totalMessages).toBe(3);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.userTokens).toBeGreaterThan(0);
      expect(stats.assistantTokens).toBeGreaterThan(0);
      expect(stats.averageTokensPerMessage).toBeGreaterThan(0);
    });

    it('should handle empty messages', () => {
      const stats = getTokenStats([]);
      expect(stats.totalMessages).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
  });
});
