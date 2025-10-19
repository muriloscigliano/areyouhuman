import fs from 'fs/promises';
import path from 'path';
import htmlPdf from 'html-pdf-node';

/**
 * PDF Generator
 * Converts HTML templates to PDF documents using html-pdf-node
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
    
    // Convert HTML to PDF
    const file = { content: html };
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    };
    
    console.log('📄 Generating PDF...');
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    console.log('✅ PDF generated successfully');
    
    return pdfBuffer;
  } catch (error: any) {
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

