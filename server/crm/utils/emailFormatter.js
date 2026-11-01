/**
 * Utility for formatting HTML/Plaintext email bodies and generating professional Outlook signatures.
 */

/**
 * Escapes HTML characters in untrusted plain text.
 */
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates a clean, professional Outlook HTML signature block.
 */
const generateOutlookSignature = ({
  displayName = '',
  jobTitle = '',
  companyName = '',
  email = '',
  phone = '',
  website = ''
}) => {
  const name = (displayName || '').trim();
  const title = (jobTitle || '').trim();
  const company = (companyName || '').trim();
  const mail = (email || '').trim();
  const tel = (phone || '').trim();
  const web = (website || '').trim();

  if (!name && !mail && !company) return '';

  const initial = name ? name.charAt(0).toUpperCase() : (mail ? mail.charAt(0).toUpperCase() : 'C');

  let titleCompany = '';
  if (title && company) {
    titleCompany = `${title} | ${company}`;
  } else if (title) {
    titleCompany = title;
  } else if (company) {
    titleCompany = company;
  }

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #334155; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; max-width: 550px;">
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
    <tr>
      <td style="vertical-align: middle; padding-right: 16px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #0f172a; color: #a3e635; font-size: 18px; font-weight: bold; text-align: center; line-height: 44px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${initial}
        </div>
      </td>
      <td style="vertical-align: middle; border-left: 2px solid #cbd5e1; padding-left: 16px;">
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">${name || 'CRM Team'}</div>
        ${titleCompany ? `<div style="font-size: 12px; color: #64748b; font-weight: 500; margin-top: 1px;">${titleCompany}</div>` : ''}
        <div style="margin-top: 6px; font-size: 12px; color: #475569;">
          ${mail ? `<span style="margin-right: 12px;">✉️ <a href="mailto:${mail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${mail}</a></span>` : ''}
          ${tel ? `<span>📞 <a href="tel:${tel}" style="color: #475569; text-decoration: none;">${tel}</a></span>` : ''}
        </div>
        ${web ? `<div style="margin-top: 3px; font-size: 12px;"><a href="${web.startsWith('http') ? web : `https://${web}`}" target="_blank" style="color: #0f766e; text-decoration: none; font-weight: 600;">🌐 ${web.replace(/^https?:\/\//, '')}</a></div>` : ''}
      </td>
    </tr>
  </table>
</div>`.trim();
};

/**
 * Formats an email body to ensure line breaks, paragraphs, bullet points, and HTML elements
 * render with 100% fidelity in Outlook, Gmail, Apple Mail, and all web/mobile clients.
 * Also attaches the Outlook/user signature if enabled.
 *
 * @param {string} content - Raw user body input (Text or HTML)
 * @param {string} signature - Optional signature HTML/text
 * @param {boolean} includeSignature - Whether to append signature
 * @returns {string} Formatted HTML ready to send via Graph API or SMTP
 */
const formatEmailHtml = (content = '', signature = '', includeSignature = true) => {
  if (!content && !signature) return '';

  let raw = String(content || '').trim();

  // Determine if content is already structured full HTML
  const hasFullHtmlStructure = /<(html|body|table|div|p|blockquote|ul|ol)[^>]*>/i.test(raw);

  let formattedBody = '';

  if (hasFullHtmlStructure) {
    // Already contains HTML markup. Ensure any loose newlines outside block tags get line breaks if needed.
    // Replace \r\n with \n
    let htmlContent = raw.replace(/\r\n/g, '\n');
    // If there are raw newlines not immediately followed or preceded by an HTML tag, convert them to <br/>
    formattedBody = htmlContent.replace(/([^>\r\n])\n([^<\r\n])/g, '$1<br/>$2');
  } else {
    // Plain text or lightly formatted text: Convert to clean responsive HTML paragraphs and lines
    const normalized = raw.replace(/\r\n/g, '\n');
    const paragraphs = normalized.split(/\n\s*\n/);

    const formattedParagraphs = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';

      // Check if this paragraph is a list of bullet items
      const lines = trimmed.split('\n');
      const isBulletList = lines.every(l => /^\s*[-*•]\s+/.test(l));
      const isNumberList = lines.every(l => /^\s*\d+[\.)]\s+/.test(l));

      if (isBulletList) {
        const items = lines
          .map(l => l.replace(/^\s*[-*•]\s+/, '').trim())
          .filter(Boolean)
          .map(item => `<li style="margin-bottom: 4px;">${item}</li>`)
          .join('');
        return `<ul style="margin: 0 0 14px 0; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 1.6;">${items}</ul>`;
      }

      if (isNumberList) {
        const items = lines
          .map(l => l.replace(/^\s*\d+[\.)]\s+/, '').trim())
          .filter(Boolean)
          .map(item => `<li style="margin-bottom: 4px;">${item}</li>`)
          .join('');
        return `<ol style="margin: 0 0 14px 0; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 1.6;">${items}</ol>`;
      }

      // Standard paragraph: replace single \n with <br/>
      const withLineBreaks = lines.join('<br/>');
      return `<p style="margin: 0 0 14px 0; line-height: 1.6; font-size: 14px; color: #1e293b;">${withLineBreaks}</p>`;
    }).filter(Boolean);

    formattedBody = formattedParagraphs.join('');
  }

  // Handle signature attachment
  let formattedSignature = '';
  if (includeSignature && signature && String(signature).trim()) {
    const rawSig = String(signature).trim();
    if (/<(div|table|p|span|img)/i.test(rawSig)) {
      formattedSignature = rawSig;
    } else {
      // Plain text signature
      const sigLines = rawSig.replace(/\r\n/g, '\n').split('\n');
      formattedSignature = `
<div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #475569; line-height: 1.5;">
  ${sigLines.join('<br/>')}
</div>`.trim();
    }
  }

  // Wrap in a high-compatibility email container with modern typography
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 650px; margin: 0 auto; padding: 12px 0;">
    ${formattedBody}
    ${formattedSignature}
  </div>
</body>
</html>`.trim();
};

module.exports = {
  formatEmailHtml,
  generateOutlookSignature,
  escapeHtml
};
