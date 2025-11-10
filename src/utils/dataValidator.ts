/**
 * Data Validation & Hallucination Prevention
 * Validates extracted lead data and prevents AI from making up information
 */

interface ExtractedData {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  role?: string | null;
  industry?: string | null;
  problem_text?: string | null;
  budget_range?: string | null;
  urgency?: string | null;
  tools_used?: string[] | null;
  interest_level?: number | null;
  automation_area?: string | null;
}

interface ValidationResult {
  isValid: boolean;
  isHallucinated: boolean;
  missingFields: string[];
  suspiciousFields: string[];
  confidence: number; // 0-1, how confident we are in the data
  warnings: string[];
}

/**
 * Check if extracted data matches what was actually said in conversation
 */
export function validateExtractedData(
  extractedData: ExtractedData,
  conversationMessages: Array<{ role: string; content: string }>
): ValidationResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const suspiciousFields: string[] = [];
  let confidence = 1.0;

  // Check if critical fields are present
  if (!extractedData.name || extractedData.name.trim() === '') {
    missingFields.push('name');
  }
  if (!extractedData.email || extractedData.email.trim() === '') {
    missingFields.push('email');
  }
  if (!extractedData.company || extractedData.company.trim() === '') {
    missingFields.push('company');
  }

  // Verify data exists in conversation (prevent hallucinations)
  const conversationText = conversationMessages
    .map(msg => msg.content.toLowerCase())
    .join(' ');

  // Check name
  if (extractedData.name) {
    const nameInConversation = conversationText.includes(extractedData.name.toLowerCase());
    if (!nameInConversation) {
      suspiciousFields.push('name');
      warnings.push(`Name "${extractedData.name}" not found in conversation`);
      confidence -= 0.2;
    }
  }

  // Check email
  if (extractedData.email) {
    const emailInConversation = conversationText.includes(extractedData.email.toLowerCase());
    if (!emailInConversation) {
      suspiciousFields.push('email');
      warnings.push(`Email "${extractedData.email}" not found in conversation`);
      confidence -= 0.3; // Email is critical, higher penalty
    }
  }

  // Check company
  if (extractedData.company) {
    const companyInConversation = conversationText.includes(extractedData.company.toLowerCase());
    if (!companyInConversation) {
      suspiciousFields.push('company');
      warnings.push(`Company "${extractedData.company}" not found in conversation`);
      confidence -= 0.2;
    }
  }

  // Check for common hallucination patterns
  if (extractedData.email) {
    // Check if email looks suspicious (common fake emails)
    const suspiciousEmails = [
      'example.com',
      'test.com',
      'sample.com',
      'demo.com',
      'placeholder',
      'your-email',
      'email@email.com'
    ];
    
    if (suspiciousEmails.some(pattern => extractedData.email!.toLowerCase().includes(pattern))) {
      suspiciousFields.push('email');
      warnings.push(`Email "${extractedData.email}" looks suspicious`);
      confidence -= 0.4;
    }
  }

  // Check for placeholder values
  const placeholderPatterns = [
    'n/a', 'na', 'none', 'not provided', 'unknown', 
    'tbd', 'to be determined', 'placeholder', 'example'
  ];
  
  Object.entries(extractedData).forEach(([key, value]) => {
    if (typeof value === 'string' && placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern)
    )) {
      suspiciousFields.push(key);
      warnings.push(`Field "${key}" contains placeholder value: "${value}"`);
      confidence -= 0.1;
    }
  });

  // Check interest_level is reasonable
  if (extractedData.interest_level !== null && extractedData.interest_level !== undefined) {
    if (extractedData.interest_level < 1 || extractedData.interest_level > 10) {
      suspiciousFields.push('interest_level');
      warnings.push(`Interest level ${extractedData.interest_level} is out of valid range (1-10)`);
      confidence -= 0.2;
    }
  }

  const isHallucinated = suspiciousFields.length > 0 || confidence < 0.5;
  const isValid = missingFields.length === 0 && !isHallucinated;

  return {
    isValid,
    isHallucinated,
    missingFields,
    suspiciousFields,
    confidence: Math.max(0, confidence),
    warnings
  };
}

/**
 * Verify if Telos actually collected required data based on conversation
 */
export function verifyDataCollection(
  conversationMessages: Array<{ role: string; content: string }>,
  requiredFields: string[] = ['name', 'email', 'company']
): {
  collected: string[];
  missing: string[];
  needsFollowUp: boolean;
} {
  const conversationText = conversationMessages
    .map(msg => msg.content.toLowerCase())
    .join(' ');

  const collected: string[] = [];
  const missing: string[] = [];

  // Check for name patterns
  const namePatterns = [
    /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:name[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  ];
  
  const hasName = namePatterns.some(pattern => pattern.test(conversationText)) ||
                  conversationText.includes('name') && conversationText.length > 50;

  // Check for email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailPattern.test(conversationText);

  // Check for company patterns
  const companyPatterns = [
    /(?:company|business|brand|organization|org)[:\s]+([A-Z][a-zA-Z\s&]+)/i,
    /(?:work at|work for|at)\s+([A-Z][a-zA-Z\s&]+)/i
  ];
  
  const hasCompany = companyPatterns.some(pattern => pattern.test(conversationText)) ||
                     conversationText.includes('company') || conversationText.includes('business');

  if (requiredFields.includes('name')) {
    if (hasName) collected.push('name');
    else missing.push('name');
  }

  if (requiredFields.includes('email')) {
    if (hasEmail) collected.push('email');
    else missing.push('email');
  }

  if (requiredFields.includes('company')) {
    if (hasCompany) collected.push('company');
    else missing.push('company');
  }

  return {
    collected,
    missing,
    needsFollowUp: missing.length > 0
  };
}

/**
 * Generate safety prompt to prevent hallucinations
 */
export function getHallucinationPreventionPrompt(): string {
  return `⚠️ CRITICAL: DO NOT HALLUCINATE DATA

You MUST follow these rules:

1. **ONLY extract data that is EXPLICITLY stated in the conversation**
   - If user didn't provide their name, return null for name
   - If user didn't provide email, return null for email
   - NEVER make up or infer information

2. **If data is missing, return null - DO NOT guess**
   - ❌ BAD: "john@example.com" (if not provided)
   - ✅ GOOD: null (if not provided)

3. **Verify data exists in conversation before extracting**
   - Check if the name/email/company was actually mentioned
   - If not mentioned, return null

4. **Never use placeholder values**
   - ❌ BAD: "example@email.com", "N/A", "Not provided"
   - ✅ GOOD: null

5. **Be honest about what you know**
   - If you're not sure, return null
   - Better to have missing data than wrong data

Remember: Missing data is better than hallucinated data.`;
}

