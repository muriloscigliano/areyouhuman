/**
 * Quote Data Formatting Utilities
 * Transforms raw conversation data into structured quote format
 */

/**
 * Extract quote data from conversation messages
 * Uses AI or rule-based extraction to identify key information
 * @param {Array} messages - Array of conversation messages
 * @returns {Object} Structured quote data
 */
export function extractQuoteFromConversation(messages) {
  // TODO: Implement AI-powered extraction using OpenAI
  // For now, this is a placeholder that shows the expected structure
  
  return {
    client_name: '',
    client_email: '',
    company_name: '',
    project_title: '',
    summary: '',
    deliverables: [],
    timeline: '',
    budget: ''
  };
}

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: AUD)
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format budget range
 * @param {number} min - Minimum amount
 * @param {number} max - Maximum amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted range (e.g., "AUD 5,000 - 7,000")
 */
export function formatBudgetRange(min, max, currency = 'AUD') {
  const minFormatted = formatCurrency(min, currency);
  const maxFormatted = formatCurrency(max, currency).replace(currency, '').trim();
  return `${minFormatted} - ${maxFormatted}`;
}

/**
 * Estimate project timeline based on complexity
 * @param {Object} projectData - Project information
 * @returns {string} Timeline estimate
 */
export function estimateTimeline(projectData) {
  const {
    num_tools = 1,
    has_custom_logic = false,
    has_dashboard = false,
    has_ai = false,
    complexity = 'simple'
  } = projectData;
  
  let weeks = 1;
  
  // Base on number of integrations
  if (num_tools <= 2) weeks = 1;
  else if (num_tools <= 4) weeks = 2;
  else weeks = 3;
  
  // Add time for complexity
  if (has_custom_logic) weeks += 1;
  if (has_dashboard) weeks += 1;
  if (has_ai) weeks += 1;
  
  // Apply complexity multiplier
  if (complexity === 'medium') weeks *= 1.25;
  if (complexity === 'complex') weeks *= 1.5;
  
  // Format output
  weeks = Math.ceil(weeks);
  
  if (weeks === 1) return '1-2 weeks';
  if (weeks === 2) return '2-3 weeks';
  if (weeks === 3) return '3-4 weeks';
  if (weeks <= 6) return '4-6 weeks';
  if (weeks <= 8) return '6-8 weeks';
  return '2-3 months';
}

/**
 * Estimate project budget based on scope
 * @param {Object} projectData - Project information
 * @returns {Object} { min: number, max: number, formatted: string }
 */
export function estimateBudget(projectData) {
  const {
    num_tools = 1,
    has_custom_logic = false,
    has_dashboard = false,
    has_ai = false,
    complexity = 'simple',
    hours_saved_per_week = 5
  } = projectData;
  
  let basePrice = 1000;
  
  // Price per tool integration
  basePrice += (num_tools - 1) * 500;
  
  // Add-ons
  if (has_custom_logic) basePrice += 1000;
  if (has_dashboard) basePrice += 1500;
  if (has_ai) basePrice += 2000;
  
  // Complexity multiplier
  if (complexity === 'medium') basePrice *= 1.3;
  if (complexity === 'complex') basePrice *= 1.8;
  
  // Calculate range (±20%)
  const min = Math.floor(basePrice * 0.8 / 100) * 100;
  const max = Math.ceil(basePrice * 1.2 / 100) * 100;
  
  return {
    min,
    max,
    formatted: formatBudgetRange(min, max)
  };
}

/**
 * Calculate ROI information
 * @param {Object} data - Project and impact data
 * @returns {Object} ROI metrics
 */
export function calculateROI(data) {
  const {
    hours_saved_per_week = 10,
    hourly_rate = 50,
    project_cost = 5000,
    errors_prevented_per_month = 0,
    error_cost = 100
  } = data;
  
  // Time savings
  const weekly_savings = hours_saved_per_week * hourly_rate;
  const monthly_savings = weekly_savings * 4.33;
  const annual_savings = monthly_savings * 12;
  
  // Error reduction savings
  const error_savings = errors_prevented_per_month * error_cost * 12;
  
  // Total annual savings
  const total_annual_savings = annual_savings + error_savings;
  
  // Payback period in months
  const payback_months = project_cost / (total_annual_savings / 12);
  
  // ROI percentage
  const roi_percent = ((total_annual_savings - project_cost) / project_cost) * 100;
  
  return {
    weekly_savings: formatCurrency(weekly_savings),
    monthly_savings: formatCurrency(monthly_savings),
    annual_savings: formatCurrency(annual_savings),
    error_savings: formatCurrency(error_savings),
    total_annual_savings: formatCurrency(total_annual_savings),
    payback_months: Math.ceil(payback_months),
    roi_percent: Math.round(roi_percent),
    formatted_summary: `Save ${formatCurrency(annual_savings)}/year, ${Math.ceil(payback_months)}-month payback, ${Math.round(roi_percent)}% ROI`
  };
}

/**
 * Generate project title from problem description
 * @param {string} problem - Problem description
 * @param {string} area - Automation area (e.g., 'onboarding', 'reporting')
 * @returns {string} Suggested project title
 */
export function generateProjectTitle(problem, area = '') {
  // Simple title generator - could be enhanced with AI
  const areaMap = {
    'onboarding': 'Customer Onboarding Automation',
    'reporting': 'Automated Reporting System',
    'data_entry': 'Data Entry Automation',
    'email': 'Email Automation System',
    'crm': 'CRM Integration & Automation',
    'ecommerce': 'E-commerce Automation',
    'scheduling': 'Scheduling Automation',
    'invoicing': 'Invoicing Automation',
    'marketing': 'Marketing Automation System'
  };
  
  return areaMap[area] || 'Custom Automation Solution';
}

/**
 * Validate quote data completeness
 * @param {Object} quoteData - Quote data object
 * @returns {Object} { valid: boolean, missing: string[], errors: string[] }
 */
export function validateQuoteData(quoteData) {
  const required = [
    'client_name',
    'client_email',
    'project_title',
    'summary',
    'deliverables',
    'timeline',
    'budget'
  ];
  
  const missing = required.filter(field => !quoteData[field]);
  const errors = [];
  
  // Validate email format
  if (quoteData.client_email && !isValidEmail(quoteData.client_email)) {
    errors.push('Invalid email format');
  }
  
  // Validate deliverables structure
  if (quoteData.deliverables && !Array.isArray(quoteData.deliverables)) {
    errors.push('Deliverables must be an array');
  } else if (quoteData.deliverables?.length === 0) {
    errors.push('At least one deliverable required');
  }
  
  // Validate each deliverable has required fields
  if (Array.isArray(quoteData.deliverables)) {
    quoteData.deliverables.forEach((item, index) => {
      if (!item.item || !item.desc) {
        errors.push(`Deliverable ${index + 1} missing item or description`);
      }
    });
  }
  
  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

/**
 * Simple email validation
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Format date for quote
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export function formatQuoteDate(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate unique quote ID
 * @param {string} prefix - Prefix for quote ID (default: Q)
 * @returns {string} Quote ID (e.g., Q-20250115-001)
 */
export function generateQuoteId(prefix = 'Q') {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Sanitize text for use in filenames
 * @param {string} text - Text to sanitize
 * @returns {string} Safe filename
 */
export function sanitizeFilename(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

