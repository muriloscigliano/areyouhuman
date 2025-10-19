import fs from 'fs/promises';
import path from 'path';

/**
 * PDF Generator
 * Converts HTML templates to PDF documents
 * 
 * TODO: Install PDF generation library
 * Options:
 * 1. html-pdf-node (lightweight, good for Vercel)
 * 2. puppeteer (more powerful but heavier)
 * 3. pdfkit (programmatic PDF creation)
 * 
 * For now using placeholder - install with:
 * npm install html-pdf-node
 */

interface QuoteData {
  client_name: string;
  project_title: string;
  summary: string;
  deliverables: Array<{ item: string; desc: string }>;
  timeline: string;
  budget: string;
  quote_date?: string;
  quote_id?: string;
}

/**
 * Generate PDF from HTML template
 * @param templatePath - Path to HTML template
 * @param data - Data to inject into template
 * @returns PDF buffer
 */
export async function generatePDF(
  templatePath: string,
  data: QuoteData
): Promise<Buffer> {
  try {
    // Read template
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Inject data into template
    const html = injectData(template, data);
    
    // TODO: Convert HTML to PDF
    // Example with html-pdf-node:
    // const pdf = require('html-pdf-node');
    // const file = { content: html };
    // const options = { format: 'A4' };
    // const pdfBuffer = await pdf.generatePdf(file, options);
    // return pdfBuffer;
    
    // Placeholder: return HTML as buffer for now
    console.log('⚠️ PDF generation not implemented yet. Returning HTML.');
    return Buffer.from(html);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Inject data into HTML template
 * Supports Handlebars-like syntax: {{variable}} and {{#each array}}
 */
function injectData(template: string, data: QuoteData): string {
  let html = template;
  
  // Add defaults
  const fullData = {
    ...data,
    quote_date: data.quote_date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    quote_id: data.quote_id || `Q-${Date.now()}`
  };
  
  // Replace simple variables: {{variable}}
  for (const [key, value] of Object.entries(fullData)) {
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    }
  }
  
  // Handle {{#each deliverables}} loops
  const deliverableMatch = html.match(/{{#each deliverables}}([\s\S]*?){{\/each}}/);
  if (deliverableMatch && fullData.deliverables) {
    const itemTemplate = deliverableMatch[1];
    const itemsHtml = fullData.deliverables
      .map(item => {
        return itemTemplate
          .replace(/{{item}}/g, item.item)
          .replace(/{{desc}}/g, item.desc);
      })
      .join('');
    html = html.replace(deliverableMatch[0], itemsHtml);
  }
  
  return html;
}

/**
 * Generate quote PDF from data
 * @param quoteData - Quote information
 * @returns PDF buffer
 */
export async function generateQuotePDF(quoteData: QuoteData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'public', 'quote-template.html');
  return generatePDF(templatePath, quoteData);
}

/**
 * Save PDF to file system
 * @param buffer - PDF buffer
 * @param filename - Output filename
 */
export async function savePDF(buffer: Buffer, filename: string): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'quotes');
  
  // Ensure directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

