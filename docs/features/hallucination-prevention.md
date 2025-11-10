# 🛡️ Hallucination Prevention System

Complete safety system to prevent AI from making up data and ensure Telos only extracts what was actually said.

## Overview

The hallucination prevention system uses multiple layers to ensure data accuracy:

1. **Anti-Hallucination Prompts** - Instructions to prevent making up data
2. **Data Validation** - Checks if extracted data exists in conversation
3. **Verification Agent** - Double-checks what Telos actually collected
4. **Automatic Cleanup** - Removes suspicious/hallucinated fields

## How It Works

### Layer 1: Prevention (Prompts)

**Location**: `src/data/prompts/anti-hallucination.md`

The system prompt explicitly instructs the AI:
- ✅ ONLY extract data explicitly stated
- ✅ Return null for missing data
- ✅ Never use placeholder values
- ✅ Verify data exists before extracting

### Layer 2: Validation (Post-Extraction)

**Location**: `src/utils/dataValidator.ts`

After extraction, validates:
- ✅ Data exists in conversation text
- ✅ No placeholder values
- ✅ No suspicious patterns
- ✅ Confidence score (0-1)

### Layer 3: Verification (Double-Check)

**Location**: `src/utils/dataValidator.ts` → `verifyDataCollection()`

Uses pattern matching to verify:
- ✅ Name patterns found in conversation
- ✅ Email patterns found in conversation
- ✅ Company patterns found in conversation

### Layer 4: Cleanup (Automatic)

If hallucination detected:
- 🗑️ Removes suspicious fields
- ⚠️ Logs warnings
- 📊 Reports confidence score

## Implementation

### Data Validator

```typescript
validateExtractedData(extractedData, conversationMessages)
```

**Returns:**
- `isValid` - Whether data passes validation
- `isHallucinated` - Whether hallucination detected
- `confidence` - Confidence score (0-1)
- `suspiciousFields` - Fields that look suspicious
- `warnings` - Detailed warnings

### Verification Agent

```typescript
verifyDataCollection(conversationMessages, requiredFields)
```

**Returns:**
- `collected` - Fields actually found in conversation
- `missing` - Fields not found
- `needsFollowUp` - Whether Telos needs to ask again

## Detection Patterns

### Hallucination Indicators

1. **Data not in conversation**
   - Name extracted but not mentioned
   - Email extracted but not provided
   - Company extracted but not stated

2. **Placeholder values**
   - `example@email.com`
   - `N/A`, `Not provided`
   - `Placeholder`, `TBD`

3. **Suspicious patterns**
   - Common fake emails
   - Generic names
   - Out-of-range values

### Confidence Scoring

- **1.0** - Perfect match, all data verified
- **0.8-0.9** - Good, minor concerns
- **0.5-0.7** - Suspicious, some fields questionable
- **<0.5** - High hallucination risk, fields removed

## Integration Points

### 1. Extraction (`src/lib/openai.ts`)

```typescript
// Anti-hallucination prompt included
const antiHallucinationPrompt = getHallucinationPreventionPrompt();

// Lower temperature for accuracy
temperature: 0.2

// Validation after extraction
const validation = validateExtractedData(extractedData, messages);
```

### 2. Chat API (`src/pages/api/chat.ts`)

```typescript
// Validate extracted data
const dataValidation = validateExtractedData(extractedInfo, messages);

// Remove hallucinated fields
if (dataValidation.isHallucinated) {
  dataValidation.suspiciousFields.forEach(field => {
    delete extractedInfo[field];
  });
}

// Verify collection
const verification = verifyDataCollection(messages, ['name', 'email', 'company']);
```

## Examples

### Example 1: Valid Extraction

**Conversation:**
```
User: "I'm John Smith from Acme Corp. Email is john@acme.com"
```

**Extraction:**
```json
{
  "name": "John Smith",
  "email": "john@acme.com",
  "company": "Acme Corp"
}
```

**Validation:**
- ✅ All fields found in conversation
- ✅ Confidence: 1.0
- ✅ No warnings

### Example 2: Hallucination Detected

**Conversation:**
```
User: "I need automation help"
```

**Extraction (WRONG):**
```json
{
  "name": "John Doe",           // ← Not in conversation
  "email": "john@example.com",  // ← Not in conversation
  "company": "Tech Corp"        // ← Not in conversation
}
```

**Validation:**
- ❌ Fields not found in conversation
- ❌ Confidence: 0.2
- ⚠️ All fields marked suspicious
- 🗑️ All fields removed

**Result:**
```json
{
  "name": null,
  "email": null,
  "company": null
}
```

### Example 3: Partial Hallucination

**Conversation:**
```
User: "My name is Sarah"
```

**Extraction:**
```json
{
  "name": "Sarah",              // ✅ Valid
  "email": "sarah@email.com",  // ❌ Not provided
  "company": null               // ✅ Valid (null)
}
```

**Validation:**
- ⚠️ Email not found in conversation
- ⚠️ Confidence: 0.6
- 🗑️ Email field removed

**Result:**
```json
{
  "name": "Sarah",
  "email": null,
  "company": null
}
```

## Monitoring

### Console Logs

The system logs:
- ✅ Successful validations
- ⚠️ Warnings and suspicious fields
- 🗑️ Removed fields
- 📊 Confidence scores

### Example Logs

```
✅ Extracted data: {"name": "John", "email": "john@acme.com"}
🛡️ VALIDATE EXTRACTED DATA (prevent hallucinations)
✅ Data validation: confidence=1.00, valid=true

⚠️ HALLUCINATION DETECTED: {
  suspiciousFields: ['email'],
  warnings: ['Email "john@example.com" not found in conversation'],
  confidence: 0.6
}
🗑️ Removing hallucinated field: email
```

## Best Practices

1. **Always validate** - Never trust extraction blindly
2. **Check confidence** - Low confidence = high risk
3. **Review warnings** - Address suspicious patterns
4. **Monitor logs** - Track hallucination frequency
5. **Update patterns** - Add new detection patterns as needed

## Configuration

### Temperature Settings

- **Extraction**: `0.2` (lower = more accurate)
- **Conversation**: `0.7` (higher = more creative)

### Confidence Thresholds

- **High confidence**: `>0.8` - Accept data
- **Medium confidence**: `0.5-0.8` - Review warnings
- **Low confidence**: `<0.5` - Remove suspicious fields

## See Also

- [Response Guardrails](./response-guardrails.md)
- [Early Extraction](./early-extraction.md)
- [Lead Qualification](./lead-qualification.md)

---

**Status**: ✅ Active
**Last Updated**: 2025-01-XX

