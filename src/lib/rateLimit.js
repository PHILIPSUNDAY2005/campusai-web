import { getAdmin } from './firebaseAdmin';

// Allows each student only "limit" requests of one kind per "windowMs".
// Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
export async function checkRateLimit(uid, name, limit, windowMs) {
  try {
    const { adminDb } = getAdmin();
    const ref = adminDb.collection('rateLimits').doc(uid + '_' + name);

    return await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const now = Date.now();

      // First request, or the old window has ended: start a new window
      if (!snapshot.exists || now - snapshot.data().windowStart >= windowMs) {
        transaction.set(ref, { count: 1, windowStart: now });
        return { allowed: true };
      }

      const data = snapshot.data();

      // Too many requests in this window
      if (data.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((data.windowStart + windowMs - now) / 1000),
        };
      }

      transaction.update(ref, { count: data.count + 1 });
      return { allowed: true };
    });
  } catch (error) {
    // If the limit check itself breaks, we let the request through
    // (the login check above still protects the route) and log the problem.
    console.error('Rate limit error:', error);
    return { allowed: true };
  }
}