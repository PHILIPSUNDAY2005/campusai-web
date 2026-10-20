import { getUserFromRequest } from '../../../lib/serverAuth';
import { getAdmin } from '../../../lib/firebaseAdmin';

// Lists this student's saved conversations, newest first
export async function GET(request) {
  const caller = await getUserFromRequest(request);
  if (!caller) {
    return Response.json({ error: 'Please log in again.' }, { status: 401 });
  }
  if (!caller.emailVerified) {
    return Response.json({ error: 'Please verify your email first.' }, { status: 403 });
  }

  try {
    const { adminDb } = getAdmin();
    const snapshot = await adminDb
      .collection('users')
      .doc(caller.uid)
      .collection('chats')
      .orderBy('updatedAt', 'desc')
      .limit(30)
      .get();

    const chats = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Chat',
        updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : 0,
      };
    });

    return Response.json({ chats: chats });
  } catch (error) {
    console.error('Chat list error:', error);
    return Response.json({ error: 'Could not load your chats right now.' }, { status: 500 });
  }
}
