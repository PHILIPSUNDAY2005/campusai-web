import { getUserFromRequest } from '../../../../lib/serverAuth';
import { getAdmin } from '../../../../lib/firebaseAdmin';

const CHAT_ID_PATTERN = /^[A-Za-z0-9]{8,40}$/;

// Checks the caller and finds the chat. It only looks inside the caller's own account.
async function findChat(request, params) {
  const caller = await getUserFromRequest(request);
  if (!caller) {
    return { error: Response.json({ error: 'Please log in again.' }, { status: 401 }) };
  }
  if (!caller.emailVerified) {
    return { error: Response.json({ error: 'Please verify your email first.' }, { status: 403 }) };
  }

  const { id } = await params;
  if (typeof id !== 'string' || !CHAT_ID_PATTERN.test(id)) {
    return { error: Response.json({ error: 'That chat was not found.' }, { status: 404 }) };
  }

  const { adminDb } = getAdmin();
  const ref = adminDb.collection('users').doc(caller.uid).collection('chats').doc(id);
  return { ref: ref };
}

// Opens one saved conversation
export async function GET(request, { params }) {
  try {
    const found = await findChat(request, params);
    if (found.error) {
      return found.error;
    }

    const snapshot = await found.ref.get();
    if (!snapshot.exists) {
      return Response.json({ error: 'That chat was not found.' }, { status: 404 });
    }

    const data = snapshot.data();
    return Response.json({
      id: snapshot.id,
      title: data.title || 'Chat',
      messages: Array.isArray(data.messages) ? data.messages : [],
    });
  } catch (error) {
    console.error('Chat open error:', error);
    return Response.json({ error: 'Could not open that chat right now.' }, { status: 500 });
  }
}

// Deletes one saved conversation
export async function DELETE(request, { params }) {
  try {
    const found = await findChat(request, params);
    if (found.error) {
      return found.error;
    }

    await found.ref.delete();
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Chat delete error:', error);
    return Response.json({ error: 'Could not delete that chat right now.' }, { status: 500 });
  }
}
