import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Arc <noreply@yourdomain.com>';

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set. Reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Arc password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#030b14;color:#eaf4ff;border-radius:16px">
        <div style="margin-bottom:32px">
          <h1 style="font-size:24px;font-weight:700;margin:0;color:#eaf4ff">Reset your password</h1>
          <p style="font-size:14px;color:#6f859c;margin:8px 0 0">You requested a password reset for your Arc account.</p>
        </div>
        <a href="${resetUrl}" style="display:inline-block;background:#06c7c8;color:#030b14;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none">
          Reset Password
        </a>
        <p style="font-size:12px;color:#6f859c;margin-top:32px">
          This link expires in <strong>1 hour</strong> and can only be used once.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="font-size:12px;color:#6f859c;margin-top:8px;word-break:break-all">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `,
  });
}
