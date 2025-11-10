# 🎯 Early Extraction Strategy

Aggressive data collection to ensure all required lead information is extracted BEFORE conversations end.

## Overview

This guide ensures Telos extracts critical lead data (name, email, company, project details) early in the conversation, preventing lost leads.

## Key Principles

1. **Extract in First 5 Messages**: Name, Email, Company
2. **Validate Quality**: Project details must be specific, not vague
3. **Never End Without Data**: If user tries to leave, politely insist on email
4. **Extract from Context**: Don't re-ask if already mentioned

## Required Data

### Critical (Must Have)
- Name (Message 3)
- Email (Message 4)
- Company (Message 5)
- Problem Text (specific, 20+ chars)
- Automation Area (specific, 10+ chars)

### Quality Checks
- Problem text must be ≥20 characters, not vague
- Automation area must be ≥10 characters, specific

## Extraction Strategies

### Strategy 1: Interrupt Flow
If user tries to skip contact info, politely redirect.

### Strategy 2: Bundle Questions
Ask for email AND company together to save messages.

### Strategy 3: Create Urgency
Make data collection feel necessary, not optional.

### Strategy 4: Extract from Context
If user mentions name/email/company naturally, extract immediately.

## Success Criteria

A conversation is successful ONLY if:
1. ✅ Name extracted (by message 5)
2. ✅ Email extracted (by message 5)
3. ✅ Company extracted (by message 5)
4. ✅ Problem text is specific (20+ chars)
5. ✅ Automation area is specific (10+ chars)

## Implementation

**Location**: `src/data/prompts/early-extraction.md`

This prompt is loaded during the `briefing` stage to guide Telos behavior.

## See Also

- [Lead Qualification](./lead-qualification.md)
- [Response Guardrails](./response-guardrails.md)

