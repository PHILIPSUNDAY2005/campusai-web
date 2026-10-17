// Turns Firebase's error codes into messages a student can understand
export function getAuthErrorMessage(error) {
  const code = error && error.code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/weak-password':
      return 'Your password must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Wrong email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Please check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}