/**
 * Email Service
 * Sends emails with quote PDFs attached using Resend
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key from dashboard
 * 3. Add RESEND_API_KEY to .env
 * 4. Verify your domain (or use onboarding@resend.dev for testing)
 */

import { Resend } from 'resend';
import { createLogger } from './logger';

const log = createLogger('email');

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface QuoteEmailData {
  clientName: string;
  projectTitle: string;
  quoteUrl?: string;
}

// Initialize Resend (uses env variable)
const getResendClient = () => {
  const apiKey = import.meta.env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('your_') || apiKey.includes('placeholder')) {
    log.warn('Resend API key not configured');
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Send email with optional attachment
 * @param options - Email options
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const resend = getResendClient();

    if (!resend) {
      log.info('Demo mode - email not sent', { to: options.to, subject: options.subject });
      return true; // Return success in demo mode
    }

    // Convert attachments to Resend format
    const resendAttachments = options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content instanceof Buffer ? att.content : Buffer.from(att.content),
    }));

    await resend.emails.send({
      from: 'Are You Human? <onboarding@resend.dev>', // Change to your verified domain
      to: options.to,
      subject: options.subject,
      html: options.html || options.text || '',
      attachments: resendAttachments
    });

    log.info('Email sent successfully', { to: options.to });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('Error sending email', error, { to: options.to });
    throw new Error(`Failed to send email: ${message}`);
  }
}

/**
 * Send quote PDF to client
 * @param email - Client email
 * @param data - Quote data
 * @param pdfBuffer - PDF file buffer
 */
export async function sendQuoteEmail(
  email: string,
  data: QuoteEmailData,
  pdfBuffer?: Buffer
): Promise<boolean> {
  const { clientName, projectTitle, quoteUrl } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Project Quote is Ready!</h1>
      </div>
      
      <div class="content">
        <p>Hi ${clientName},</p>
        
        <p>Thank you for discussing your project with us! I've prepared a detailed quote for <strong>${projectTitle}</strong>.</p>
        
        ${quoteUrl ? `
          <p style="text-align: center;">
            <a href="${quoteUrl}" class="button">View Your Quote</a>
          </p>
        ` : '<p>Please find your quote attached to this email.</p>'}
        
        <p>This quote includes:</p>
        <ul>
          <li>Detailed project scope</li>
          <li>Timeline estimates</li>
          <li>Investment breakdown</li>
          <li>Next steps</li>
        </ul>
        
        <p>I'm here to answer any questions you may have. Feel free to reply to this email or schedule a call to discuss further.</p>
        
        <p>Looking forward to working with you!</p>
        
        <p>Best regards,<br>
        <strong>Are You Human? Team</strong></p>
      </div>
      
      <div class="footer">
        <p>Are You Human? | Intelligent Automation Solutions</p>
        <p>info@areyouhuman.com | areyouhuman.com</p>
      </div>
    </body>
    </html>
  `;
  
  const attachments = pdfBuffer ? [{
    filename: `quote-${projectTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }] : [];
  
  return sendEmail({
    to: email,
    subject: `Your Project Quote: ${projectTitle}`,
    html,
    attachments
  });
}

/**
 * Send follow-up email after quote
 * @param email - Client email
 * @param clientName - Client name
 */
export async function sendFollowUpEmail(
  email: string,
  clientName: string
): Promise<boolean> {
  const html = `
    <p>Hi ${clientName},</p>
    <p>I wanted to follow up on the quote I sent you. Have you had a chance to review it?</p>
    <p>I'm here to answer any questions or discuss any adjustments you might need.</p>
    <p>Best regards,<br>Are You Human? Team</p>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Following up on your project quote',
    html
  });
}

