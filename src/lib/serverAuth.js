import { getAdmin } from './firebaseAdmin';

// Finds out which student is calling the server.
// The browser sends its login token in the "Authorization" header.
// Returns { uid, email, emailVerified } or null.
// The reason for a failure is written to the server log (never sent to the browser).
export async function getUserFromRequest(request) {
  const header = request.headers.get('authorization') || '';

  if (!header.startsWith('Bearer ')) {
    console.error('Auth: the request had no Bearer token');
    return null;
  }

  let adminAuth;
  try {
    ({ adminAuth } = getAdmin());
  } catch (error) {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '';
    console.error(
      'Auth: Firebase Admin could not start (' + error.name + '). Key present: ' +
        (encoded !== '') + ', key length: ' + encoded.length
    );
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: decoded.email_verified === true,
    };
  } catch (error) {
    console.error('Auth: token check failed:', error.code || error.name, '-', error.message);
    return null;
  }
}