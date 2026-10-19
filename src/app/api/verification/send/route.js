import crypto from 'crypto';
import { getAdmin } from '../../../../lib/firebaseAdmin';
import { getUserFromRequest } from '../../../../lib/serverAuth';

// Give the server up to 30 seconds (the email service may need retries)
export const maxDuration = 30;

const CODE_LIFETIME_MS = 10 * 60 * 1000; // a code works for 10 minutes
const RESEND_WAIT_MS = 60 * 1000; // wait 60 seconds before sending another one
const MAX_EMAIL_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// We never store the code itself, only a scrambled version of it
function hashCode(salt, code) {
  return crypto.createHash('sha256').update(salt + ':' + code).digest('hex');
}

// Sends the code email through Brevo. Tries again if the connection drops.
async function sendCodeEmail(toEmail, code) {
  const senderName = process.env.EMAIL_FROM_NAME || 'CampusAI';
  const senderEmail = process.env.EMAIL_FROM_ADDRESS;

  if (!process.env.BREVO_API_KEY || !senderEmail) {
    throw new Error('Email settings are missing on the server');
  }

  const htmlContent =
    '<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;">' +
    '<h2 style="color:#2563EB;margin:0 0 12px;">CampusAI</h2>' +
    '<p style="font-size:15px;color:#0F172A;">Use this code to verify your email address:</p>' +
    '<p style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#0F172A;margin:16px 0;">' +
    code +
    '</p>' +
    '<p style="font-size:13px;color:#64748B;">This code expires in 10 minutes. ' +
    'If you did not create a CampusAI account, you can ignore this email.</p>' +
    '</div>';

  const body = JSON.stringify({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail }],
    subject: 'Your CampusAI verification code: ' + code,
    htmlContent: htmlContent,
    textContent:
      'Your CampusAI verification code is ' +
      code +
      '. It expires in 10 minutes. If you did not create an account, ignore this email.',
  });

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_EMAIL_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: body,
      });

      if (response.ok) {
        return;
      }

      // Brevo answered with a problem. Retrying will not help.
      const text = await response.text();
      throw Object.assign(new Error('Brevo ' + response.status + ': ' + text.slice(0, 300)), {
        noRetry: true,
      });
    } catch (error) {
      lastError = error;
      console.error('Email error (attempt ' + attempt + ' of ' + MAX_EMAIL_ATTEMPTS + '):', error);

      if (error.noRetry || attempt === MAX_EMAIL_ATTEMPTS) {
        break;
      }
      await sleep(1500);
    }
  }

  throw lastError;
}

export async function POST(request) {
  // 1. Who is asking?
  const caller = await getUserFromRequest(request);
  if (!caller || !caller.email) {
    return Response.json({ error: 'Please log in again.' }, { status: 401 });
  }

  try {
    const { adminAuth, adminDb } = getAdmin();

    // 2. Already verified? Nothing to do.
    const account = await adminAuth.getUser(caller.uid);
    if (account.emailVerified) {
      return Response.json({ alreadyVerified: true });
    }

    // 3. Too soon after the last code?
    const ref = adminDb.collection('emailCodes').doc(caller.uid);
    const existing = await ref.get();

    if (existing.exists) {
      const waitLeft = existing.data().lastSentAt + RESEND_WAIT_MS - Date.now();
      if (waitLeft > 0) {
        return Response.json(
          {
            error: 'Please wait before asking for another code.',
            secondsLeft: Math.ceil(waitLeft / 1000),
          },
          { status: 429 }
        );
      }
    }

    // 4. Make a new 6-digit code and save its scrambled version
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const salt = crypto.randomBytes(16).toString('hex');

    await ref.set({
      codeHash: hashCode(salt, code),
      salt: salt,
      expiresAt: Date.now() + CODE_LIFETIME_MS,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    // 5. Send the email. If it fails, remove the code so the student can try again at once.
    try {
      await sendCodeEmail(caller.email, code);
    } catch (error) {
      await ref.delete();
      return Response.json(
        { error: 'We could not send the email right now. Please try again.' },
        { status: 502 }
      );
    }

    return Response.json({ sent: true });
  } catch (error) {
    console.error('Send code error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}