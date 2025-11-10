# 🛡️ Response Guardrails

AI response validation system to ensure Telos stays on-topic and within word limits.

## Overview

The response guardrails system ensures:
- ✅ Responses stay focused on automation, AI, and business solutions
- ✅ Responses are limited to 200 words maximum
- ✅ Off-topic questions are redirected with fun, contextual messages

## Implementation

**Location**: `src/utils/responseGuardrails.ts`

### Key Functions

- `validateResponse()` - Validates topic relevance and word count
- `isOnTopic()` - Checks if response matches business context
- `countWords()` - Accurate word counting
- `truncateToWordLimit()` - Smart truncation preserving sentences
- `generateRedirectMessage()` - Fun redirect messages

## Configuration

### Word Limit
- **Maximum**: 200 words per response
- Automatic truncation if exceeded

### Topic Boundaries

**On-Topic Keywords:**
- automation, AI, workflow, business, project, solution, strategy

**Off-Topic Keywords:**
- recipes, weather, sports, medical advice, entertainment

### Redirect Messages

8 contextual redirect messages that bring users back to the business context in a fun, smart way.

## Integration

- Applied in `src/lib/openai.ts` after response generation
- Double-checked in `src/pages/api/chat.ts` before sending
- Instructions added to `src/data/prompts/objective.md`

## See Also

- [Lead Qualification](./lead-qualification.md)
- [Early Extraction](./early-extraction.md)

