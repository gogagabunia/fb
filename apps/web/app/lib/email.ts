import nodemailer from 'nodemailer';

interface ModerationDetails {
  id: string;
  authorName: string;
  rawText: string;
  groupName: string;
}

/**
 * Escape untrusted text before interpolating it into the HTML email body.
 * Everything here originates from a scraped Facebook post, i.e. from whoever
 * wrote that post — it must never be treated as markup.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send the account-verification code to a freshly registered user. Mirrors the
 * moderation-alert transport: real SMTP when configured, otherwise the code is
 * printed to stdout so local development (where no SMTP is set) can still read
 * it and complete the flow.
 */
export async function sendVerificationEmail(to: string, code: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'no-reply@groupmarket.com';

  // The code is app-generated (six digits) so it needs no escaping, but run it
  // through escapeHtml anyway — defence in depth against ever passing something
  // else here.
  const safeCode = escapeHtml(code);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8f9fa; color: #191c1d; margin: 0; padding: 20px; }
          .container { max-width: 600px; background-color: #ffffff; border: 1px solid #c4c6cd; border-radius: 12px; padding: 32px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .header { border-bottom: 1px solid #edeeef; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #041627; text-decoration: none; }
          .title { font-size: 20px; font-weight: bold; color: #041627; margin: 0 0 8px 0; }
          .code { font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #041627; text-align: center; background: #f3f4f5; border: 1px solid #e7e8e9; border-radius: 10px; padding: 20px; margin: 24px 0; }
          .footer { font-size: 11px; color: #74777d; text-align: center; margin-top: 32px; border-top: 1px solid #edeeef; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="#" class="logo">GroupMarket</a>
          </div>
          <h2 class="title">Confirm your email</h2>
          <p style="font-size: 14px; color: #44474c; line-height: 1.5; margin: 0;">
            Enter this code on the verification screen to activate your account. It expires in 15 minutes.
          </p>
          <div class="code">${safeCode}</div>
          <p style="font-size: 13px; color: #74777d; line-height: 1.5; margin: 0;">
            If you didn't create a GroupMarket account, you can safely ignore this email.
          </p>
          <div class="footer">
            © 2026 GroupMarket. Account Security.
          </div>
        </div>
      </body>
    </html>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: 'Your GroupMarket verification code',
        html: htmlContent,
      });

      console.log(`[Email Sent] Verification code to ${to}, Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email Failed] Verification email transmission failed:', error);
      return { success: false, error };
    }
  } else {
    // No SMTP configured — surface the code in the logs so dev can proceed.
    console.log('\n--- 🔐 EMAIL VERIFICATION CODE (dev emulator) ---');
    console.log(`To: ${to}`);
    console.log(`Code: ${code}`);
    console.log('--- ---------------------------------------- ---\n');
    return { success: true, simulated: true };
  }
}

export async function sendAdminModerationAlert(details: ModerationDetails) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'no-reply@groupmarket.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@groupmarket.com';

  const previewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8f9fa; color: #191c1d; margin: 0; padding: 20px; }
          .container { max-width: 600px; background-color: #ffffff; border: 1px solid #c4c6cd; border-radius: 12px; padding: 32px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .header { border-bottom: 1px solid #edeeef; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #041627; text-decoration: none; }
          .badge { display: inline-block; background-color: #ffdad6; color: #ba1a1a; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: bold; color: #041627; margin: 0 0 8px 0; }
          .detail-box { background-color: #f3f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e7e8e9; }
          .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #74777d; margin-bottom: 4px; display: block; }
          .value { font-size: 14px; font-weight: 500; color: #191c1d; margin: 0 0 12px 0; }
          .value:last-child { margin-bottom: 0; }
          .text-snippet { font-family: inherit; font-size: 13px; color: #44474c; white-space: pre-wrap; line-height: 1.5; background: #ffffff; border: 1px solid #c4c6cd; border-radius: 6px; padding: 12px; margin-top: 4px; max-height: 120px; overflow-y: auto; }
          .cta-button { display: inline-block; background-color: #041627; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 24px; text-align: center; }
          .footer { font-size: 11px; color: #74777d; text-align: center; margin-top: 32px; border-top: 1px solid #edeeef; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="#" class="logo">GroupMarket</a>
          </div>
          
          <span class="badge">Awaiting Moderation</span>
          <h2 class="title">New Classified Post Imported</h2>
          <p style="font-size: 14px; color: #44474c; line-height: 1.5; margin: 0;">
            Our automated scraper has found a new listing match that requires manual review before publishing to the public feed.
          </p>
          
          <div class="detail-box">
            <span class="label">Source Facebook Group</span>
            <p class="value">${escapeHtml(details.groupName)}</p>

            <span class="label">Author</span>
            <p class="value">${escapeHtml(details.authorName)}</p>

            <span class="label">Raw Post Content</span>
            <div class="text-snippet">${escapeHtml(details.rawText)}</div>
          </div>
          
          <center>
            <a href="${previewLink}" class="cta-button">Open Moderation Queue</a>
          </center>
          
          <div class="footer">
            © 2026 GroupMarket. Automated Scraper Alerts.
          </div>
        </div>
      </body>
    </html>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: adminEmail,
        // Subject is plain text, so it takes the raw value; strip newlines to
        // prevent header injection.
        subject: `[Moderation Pending] New listing found in "${details.groupName.replace(/[\r\n]+/g, ' ')}"`,
        html: htmlContent,
      });

      console.log(`[Email Sent] Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email Failed] SMTP transmission failed:', error);
      return { success: false, error };
    }
  } else {
    // Elegant dev environment logging fallback
    console.log('\n--- 📬 ADMIN EMAIL NOTIFICATION EMULATOR ---');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: [Moderation Pending] New listing found in "${details.groupName}"`);
    console.log(`Source Group: ${details.groupName}`);
    console.log(`Author: ${details.authorName}`);
    console.log('--- ------------------------------------ ---\n');
    return { success: true, simulated: true };
  }
}
