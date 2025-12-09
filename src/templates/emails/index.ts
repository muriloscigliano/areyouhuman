/**
 * Email Templates
 * Centralized email template generation for all notification types
 */

import { generateBaseTemplate, escapeHtml } from './base';
import type { LeadData, QuoteData } from '../../types';

// =============================================================================
// LEAD EMAILS
// =============================================================================

export interface WelcomeEmailData {
  name: string;
  company?: string;
  automationArea?: string;
  problemText?: string;
}

/**
 * Generate welcome email for new leads
 */
export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { name, company, automationArea, problemText } = data;

  const content = `
    <p>Hi ${escapeHtml(name)},</p>

    <p>Thanks for chatting with Telos! I've passed your project details to our team, and they're already analyzing how we can help you with <strong>${escapeHtml(automationArea || 'your automation needs')}</strong>.</p>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>📊 We're analyzing your requirements</li>
      <li>💰 Calculating ROI and pricing</li>
      <li>📝 Preparing a custom proposal</li>
    </ul>

    <p>You'll receive a detailed proposal in your inbox within 24 hours. It will include:</p>
    <ul>
      <li>✅ Tailored automation strategy</li>
      <li>⏱️ Timeline and milestones</li>
      <li>💵 Transparent pricing</li>
      <li>🚀 Next steps to get started</li>
    </ul>

    ${problemText ? `
      <div class="highlight">
        <p><strong>Your Challenge:</strong><br>
        <em>"${escapeHtml(problemText)}"</em></p>
      </div>
    ` : ''}

    <p>In the meantime, if you have any questions or want to discuss your project further, just reply to this email!</p>

    <div class="signature">
      <p>Stay Human. Stay Ahead.</p>
      <p>Best,<br><strong>The Are You Human? Team</strong></p>
    </div>
  `;

  return generateBaseTemplate({
    title: 'Thanks for Connecting!',
    headerEmoji: '🎉',
    preheader: `We're excited to help ${company || 'you'} with automation`,
    content,
  });
}

// =============================================================================
// QUOTE EMAILS
// =============================================================================

export interface QuoteEmailData {
  name: string;
  projectTitle: string;
  quoteUrl?: string;
  hasPdfAttachment?: boolean;
}

/**
 * Generate quote delivery email
 */
export function generateQuoteEmail(data: QuoteEmailData): string {
  const { name, projectTitle, quoteUrl, hasPdfAttachment } = data;

  const content = `
    <p>Hi ${escapeHtml(name)},</p>

    <p>Thank you for discussing your project with us! I've prepared a detailed quote for <strong>${escapeHtml(projectTitle)}</strong>.</p>

    ${quoteUrl ? `
      <p style="text-align: center;">
        <a href="${escapeHtml(quoteUrl)}" class="button">View Your Quote</a>
      </p>
    ` : hasPdfAttachment ? `
      <p>Please find your quote attached to this email.</p>
    ` : ''}

    <p>This quote includes:</p>
    <ul>
      <li>📋 Detailed project scope</li>
      <li>⏱️ Timeline estimates</li>
      <li>💰 Investment breakdown</li>
      <li>🚀 Next steps</li>
    </ul>

    <p>I'm here to answer any questions you may have. Feel free to reply to this email or schedule a call to discuss further.</p>

    <div class="signature">
      <p>Looking forward to working with you!</p>
      <p>Best regards,<br><strong>The Are You Human? Team</strong></p>
    </div>
  `;

  return generateBaseTemplate({
    title: 'Your Project Quote is Ready!',
    headerColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    preheader: `Your quote for ${projectTitle} is ready`,
    content,
  });
}

// =============================================================================
// QUOTE ACCEPTED EMAIL
// =============================================================================

export interface QuoteAcceptedEmailData {
  name: string;
  company?: string;
  projectTitle: string;
}

/**
 * Generate quote accepted confirmation email
 */
export function generateQuoteAcceptedEmail(data: QuoteAcceptedEmailData): string {
  const { name, company, projectTitle } = data;

  const content = `
    <p>Hi ${escapeHtml(name)},</p>

    <p>Fantastic news! We've received your acceptance for <strong>${escapeHtml(projectTitle)}</strong>.</p>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>📅 We'll schedule a kickoff call within 48 hours</li>
      <li>📋 You'll receive access to our project dashboard</li>
      <li>👥 We'll introduce you to your dedicated team</li>
      <li>🚀 We'll finalize the project timeline</li>
    </ul>

    <p>Our team is thrilled to work with ${escapeHtml(company || 'you')} on this project. We're committed to delivering exceptional results.</p>

    <p>Keep an eye on your inbox for your onboarding materials and meeting invite!</p>

    <div class="signature">
      <p>Excited to build something amazing together!</p>
      <p>Best,<br><strong>The Are You Human? Team</strong></p>
    </div>
  `;

  return generateBaseTemplate({
    title: 'Welcome Aboard!',
    headerEmoji: '🎉',
    headerColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    preheader: 'Your project is confirmed - let\'s build something amazing!',
    content,
  });
}

// =============================================================================
// QUOTE DECLINED / FEEDBACK EMAIL
// =============================================================================

export interface QuoteDeclinedEmailData {
  name: string;
  projectTitle: string;
  declineReason?: string;
}

/**
 * Generate feedback request email when quote is declined
 */
export function generateQuoteDeclinedEmail(data: QuoteDeclinedEmailData): string {
  const { name, projectTitle, declineReason } = data;

  const content = `
    <p>Hi ${escapeHtml(name)},</p>

    <p>Thank you for considering Are You Human? for your <strong>${escapeHtml(projectTitle)}</strong> project.</p>

    <p>We noticed that you decided not to move forward with our proposal. While we're sorry it wasn't the right fit, we'd love to learn how we can improve.</p>

    ${declineReason ? `
      <div class="highlight">
        <p><strong>Your feedback:</strong><br>
        <em>"${escapeHtml(declineReason)}"</em></p>
      </div>
    ` : ''}

    <p><strong>Would you mind sharing more?</strong></p>
    <ul>
      <li>Was it pricing, timeline, or scope?</li>
      <li>Did you find a better alternative?</li>
      <li>Is there anything we could have done differently?</li>
    </ul>

    <p>Your honest feedback helps us serve clients like you better. Just reply to this email with your thoughts!</p>

    <p><strong>Still interested?</strong> If circumstances change, we'd be happy to revisit this conversation. We're here whenever you need us.</p>

    <div class="signature">
      <p>Thanks again for your time,</p>
      <p>Best,<br><strong>The Are You Human? Team</strong></p>
    </div>
  `;

  return generateBaseTemplate({
    title: 'Help Us Improve',
    headerEmoji: '💭',
    headerColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    preheader: 'Quick feedback? We\'d love to hear from you',
    content,
  });
}

// =============================================================================
// FOLLOW-UP EMAILS
// =============================================================================

export interface FollowUpEmailData {
  name: string;
  daysSinceQuote: number;
  projectTitle?: string;
}

/**
 * Generate follow-up email after quote sent
 */
export function generateFollowUpEmail(data: FollowUpEmailData): string {
  const { name, daysSinceQuote, projectTitle } = data;

  const content = `
    <p>Hi ${escapeHtml(name)},</p>

    <p>I wanted to follow up on the ${projectTitle ? `quote for <strong>${escapeHtml(projectTitle)}</strong>` : 'quote'} I sent you ${daysSinceQuote === 1 ? 'yesterday' : `${daysSinceQuote} days ago`}.</p>

    <p>Have you had a chance to review it? I'm here to:</p>
    <ul>
      <li>Answer any questions you might have</li>
      <li>Discuss adjustments to the scope or timeline</li>
      <li>Explore alternative approaches if needed</li>
    </ul>

    <p>Just reply to this email or let me know a good time to chat!</p>

    <div class="signature">
      <p>Best regards,<br><strong>The Are You Human? Team</strong></p>
    </div>
  `;

  return generateBaseTemplate({
    title: 'Following Up',
    headerColor: 'linear-gradient(135deg, #fb6400 0%, #ff7a1a 100%)',
    preheader: 'Quick follow-up on your project quote',
    content,
  });
}

// =============================================================================
// NURTURE EMAILS
// =============================================================================

export interface NurtureEmailData {
  name: string;
  company?: string;
  stage: 'day0' | 'day2' | 'day5' | 'day10' | 'day15';
}

/**
 * Generate nurture sequence email based on stage
 */
export function generateNurtureEmail(data: NurtureEmailData): string {
  const { name, company, stage } = data;

  const templates: Record<string, { title: string; emoji: string; content: string }> = {
    day0: {
      title: 'Thanks for Your Interest',
      emoji: '👋',
      content: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for chatting with us! While we're not moving forward right now, we'd love to stay connected.</p>
        <p>Feel free to reach out anytime you're ready to explore automation opportunities.</p>
        <div class="signature">
          <p>Stay Human. Stay Ahead.</p>
          <p>The Are You Human? Team</p>
        </div>
      `,
    },
    day2: {
      title: 'Some Inspiration for You',
      emoji: '💡',
      content: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>I thought you might find these case studies interesting:</p>
        <ul>
          <li><strong>E-commerce:</strong> How we saved 20+ hours/week with inventory automation</li>
          <li><strong>Professional Services:</strong> AI-powered client onboarding that cut manual work by 80%</li>
          <li><strong>Marketing:</strong> Automated reporting that runs itself</li>
        </ul>
        <p>Any of these resonate with what you're trying to achieve?</p>
        <div class="signature">
          <p>Best,<br>The Are You Human? Team</p>
        </div>
      `,
    },
    day5: {
      title: 'Quick ROI Calculator',
      emoji: '📊',
      content: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Here's a quick way to estimate your automation ROI:</p>
        <div class="highlight">
          <p><strong>Hours spent on repetitive tasks per week × $50 × 52 weeks = Annual opportunity cost</strong></p>
        </div>
        <p>Most of our clients see 3-6 month payback periods. Curious what yours might look like?</p>
        <div class="signature">
          <p>Best,<br>The Are You Human? Team</p>
        </div>
      `,
    },
    day10: {
      title: 'Still Thinking About Automation?',
      emoji: '🤔',
      content: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>No pressure, but I wanted to check in. Sometimes timing isn't right, and that's totally okay.</p>
        <p>When you're ready to explore automation, we'll be here. In the meantime, feel free to reply with any questions!</p>
        <div class="signature">
          <p>Best,<br>The Are You Human? Team</p>
        </div>
      `,
    },
    day15: {
      title: 'One Last Note',
      emoji: '✉️',
      content: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>This is my last follow-up for now. I don't want to clutter your inbox!</p>
        <p>If you ever want to revisit automation opportunities for ${escapeHtml(company || 'your business')}, just reply to this email. We'd love to help.</p>
        <p>Wishing you all the best!</p>
        <div class="signature">
          <p>Best,<br>The Are You Human? Team</p>
        </div>
      `,
    },
  };

  const template = templates[stage] || templates.day0;

  return generateBaseTemplate({
    title: template.title,
    headerEmoji: template.emoji,
    content: template.content,
  });
}

// =============================================================================
// INTERNAL NOTIFICATIONS
// =============================================================================

export interface TeamNotificationData {
  leadName: string;
  leadEmail: string;
  company?: string;
  projectSummary?: string;
  budgetRange?: string;
  urgency?: string;
  leadScore?: number;
}

/**
 * Generate internal team notification email
 */
export function generateTeamNotificationEmail(data: TeamNotificationData): string {
  const {
    leadName,
    leadEmail,
    company,
    projectSummary,
    budgetRange,
    urgency,
    leadScore,
  } = data;

  const content = `
    <p><strong>New qualified lead from Telos Chat!</strong></p>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeHtml(leadName)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${escapeHtml(leadEmail)}">${escapeHtml(leadEmail)}</a></td>
      </tr>
      ${company ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Company:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeHtml(company)}</td>
      </tr>
      ` : ''}
      ${budgetRange ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Budget:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeHtml(budgetRange)}</td>
      </tr>
      ` : ''}
      ${urgency ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Urgency:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeHtml(urgency)}</td>
      </tr>
      ` : ''}
      ${leadScore !== undefined ? `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Lead Score:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${leadScore}/100</td>
      </tr>
      ` : ''}
    </table>

    ${projectSummary ? `
      <div class="highlight" style="margin-top: 16px;">
        <p><strong>Project Summary:</strong></p>
        <p>${escapeHtml(projectSummary)}</p>
      </div>
    ` : ''}

    <p style="margin-top: 16px;"><strong>Action Required:</strong> Review and respond within 24 hours.</p>
  `;

  return generateBaseTemplate({
    title: 'New Qualified Lead',
    headerEmoji: '🎯',
    headerColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    footerText: 'Are You Human? Internal Notification',
    content,
  });
}
