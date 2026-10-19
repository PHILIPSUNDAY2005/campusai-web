import { getAdmin } from './firebaseAdmin';

// Finds out which student is calling the server.
// The browser sends its login token in the "Authorization" header.
// Returns { uid, email, emailVerified } or null.
export async function getUserFromRequest(request) {
  const header = request.headers.get('authorization') || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  try {
    const { adminAuth } = getAdmin();
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: decoded.email_verified === true,
    };
  } catch (error) {
    return null;
  }
}