import nodemailer from 'nodemailer';

interface ModerationDetails {
  id: string;
  authorName: string;
  rawText: string;
  groupName: string;
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
            <p class="value">${details.groupName}</p>
            
            <span class="label">Author</span>
            <p class="value">${details.authorName}</p>
            
            <span class="label">Raw Post Content</span>
            <div class="text-snippet">${details.rawText}</div>
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
        subject: `[Moderation Pending] New listing found in "${details.groupName}"`,
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
