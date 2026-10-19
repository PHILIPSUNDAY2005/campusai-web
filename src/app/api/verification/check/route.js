import crypto from 'crypto';
import { getAdmin } from '../../../../lib/firebaseAdmin';
import { getUserFromRequest } from '../../../../lib/serverAuth';

const MAX_WRONG_TRIES = 5;

function hashCode(salt, code) {
  return crypto.createHash('sha256').update(salt + ':' + code).digest('hex');
}

export async function POST(request) {
  // 1. Who is asking?
  const caller = await getUserFromRequest(request);
  if (!caller) {
    return Response.json({ error: 'Please log in again.' }, { status: 401 });
  }

  // 2. Read the code the student typed
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) {
    return Response.json({ error: 'Please enter the 6-digit code.' }, { status: 400 });
  }

  try {
    const { adminAuth, adminDb } = getAdmin();
    const ref = adminDb.collection('emailCodes').doc(caller.uid);

    // 3. Check the code. A transaction stops two checks from running at the same moment.
    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);

      if (!snapshot.exists) {
        return { status: 'none' };
      }

      const data = snapshot.data();

      if (Date.now() > data.expiresAt) {
        transaction.delete(ref);
        return { status: 'expired' };
      }

      if (data.attempts >= MAX_WRONG_TRIES) {
        return { status: 'locked' };
      }

      const given = Buffer.from(hashCode(data.salt, code), 'hex');
      const saved = Buffer.from(data.codeHash, 'hex');
      const matches = given.length === saved.length && crypto.timingSafeEqual(given, saved);

      if (!matches) {
        transaction.update(ref, { attempts: data.attempts + 1 });
        return { status: 'wrong', triesLeft: MAX_WRONG_TRIES - (data.attempts + 1) };
      }

      return { status: 'ok' };
    });

    // 4. Answer the student
    if (result.status === 'none') {
      return Response.json(
        { error: 'No active code. Please ask for a new one.' },
        { status: 400 }
      );
    }
    if (result.status === 'expired') {
      return Response.json(
        { error: 'That code has expired. Please ask for a new one.' },
        { status: 400 }
      );
    }
    if (result.status === 'locked') {
      return Response.json(
        { error: 'Too many wrong tries. Please ask for a new code.' },
        { status: 429 }
      );
    }
    if (result.status === 'wrong') {
      return Response.json(
        {
          error:
            result.triesLeft > 0
              ? 'That code is not correct. You have ' + result.triesLeft + ' tries left.'
              : 'That code is not correct. Please ask for a new code.',
        },
        { status: 400 }
      );
    }

    // 5. Correct code: mark the account as verified, then remove the used code
    await adminAuth.updateUser(caller.uid, { emailVerified: true });
    await ref.delete();

    return Response.json({ verified: true });
  } catch (error) {
    console.error('Check code error:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}