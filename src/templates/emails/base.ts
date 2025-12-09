/**
 * Base Email Template
 * Provides consistent styling and structure for all emails
 */

export interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  headerColor?: string;
  headerEmoji?: string;
  content: string;
  footerText?: string;
}

/**
 * Base email CSS styles
 */
const BASE_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .wrapper {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .content {
    background: #ffffff;
    padding: 30px;
    border-radius: 0 0 8px 8px;
    border: 1px solid #e0e0e0;
    border-top: none;
  }
  .content p {
    margin: 0 0 16px 0;
  }
  .content ul {
    margin: 16px 0;
    padding-left: 24px;
  }
  .content li {
    margin-bottom: 8px;
  }
  .button {
    display: inline-block;
    background: #fb6400;
    color: white !important;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 16px 0;
  }
  .button:hover {
    background: #ff7a1a;
  }
  .footer {
    text-align: center;
    color: #64748b;
    font-size: 14px;
    margin-top: 30px;
    padding: 20px;
  }
  .footer a {
    color: #fb6400;
    text-decoration: none;
  }
  .highlight {
    background: #fff7ed;
    border-left: 4px solid #fb6400;
    padding: 16px;
    margin: 16px 0;
    border-radius: 0 4px 4px 0;
  }
  .signature {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }
`;

/**
 * Generate the base email HTML template
 */
export function generateBaseTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    preheader = '',
    headerColor = 'linear-gradient(135deg, #fb6400 0%, #ff7a1a 100%)',
    headerEmoji = '',
    content,
    footerText = 'Are You Human? | AI-Powered Automation Consulting',
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header" style="background: ${headerColor};">
      <h1>${headerEmoji ? `${headerEmoji} ` : ''}${title}</h1>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <p>${footerText}</p>
      <p><a href="https://areyouhuman.com">areyouhuman.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML in user-provided content
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
