import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Privacy Policy | CampusAI',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 19, 2026">
      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your full name, your email address and your password.
          Your password is handled by Firebase Authentication, so we never see it in readable
          form.
        </li>
        <li>
          <strong>Verification code details:</strong> when you sign up, we create a 6-digit code
          and email it to you. We keep only a scrambled (hashed) version of the code, the time
          it expires and the number of wrong tries.
        </li>
        <li>
          <strong>What you type into the AI:</strong> the questions you ask in the chat and the
          notes you paste to be summarized.
        </li>
        <li>
          <strong>Summaries you save:</strong> when you press Save Summary, we store the summary
          title, its key points and the time you saved it, under your own account.
        </li>
        <li>
          <strong>Usage counts:</strong> a small counter of how many AI requests your account has
          made recently, so that one account cannot overload the service.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To create your account and log you in.</li>
        <li>To check that the email address belongs to you.</li>
        <li>To show your name and your saved summaries in the app.</li>
        <li>To send your questions and notes to the AI so it can reply or summarize.</li>
        <li>To send account emails, such as your verification code and password reset links.</li>
        <li>To limit how many AI requests one account can make in a short time.</li>
      </ul>

      <h2>3. Who handles your data</h2>
      <ul>
        <li>
          <strong>Google Firebase</strong> handles sign up, login and password reset. Its
          database also holds your saved summaries, the temporary verification code details and
          the usage counts described above.
        </li>
        <li>
          <strong>Brevo</strong> delivers our emails. It receives your email address and the
          content of the message, and it keeps delivery records for a time.
        </li>
        <li>
          <strong>Google Gemini</strong> receives your questions and pasted notes in order to
          produce answers and summaries. Google&apos;s own terms apply to that content.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. What we do not save</h2>
      <p>
        CampusAI does not store your chat messages, and it does not store the full notes you paste
        for summarizing. They exist in your browser while you use the page and are sent to the AI
        service to get a reply. Only a summary that you choose to save is kept. Your saved
        summaries are private to your account, and other students cannot read them.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>
          A verification code stops working after 10 minutes. It is removed when you verify, or
          replaced when you ask for a new one.
        </li>
        <li>
          Your account details and saved summaries stay until you ask us to delete them or your
          account.
        </li>
      </ul>

      <h2>6. Browser storage</h2>
      <p>
        Your browser stores a few small items so the app works: your login session (set by
        Firebase), your light or dark theme choice, and a note that you have already seen the
        welcome screen. We do not use advertising trackers.
      </p>

      <h2>7. Keeping your data safe</h2>
      <p>
        We use trusted services, keep secret keys on the server away from your browser, and use
        database rules so that each student can read only their own saved summaries. No online
        service can promise perfect security, so please do not paste highly sensitive information
        into the chat.
      </p>

      <h2>8. Your choices</h2>
      <ul>
        <li>You can ask us to delete your account and its data, including saved summaries.</li>
        <li>You can ask what information we hold about you.</li>
        <li>You can stop using CampusAI at any time.</li>
      </ul>

      <h2>9. Children</h2>
      <p>
        CampusAI is meant for university students. If you believe a child has created an
        account, please contact us so we can remove it.
      </p>

      <h2>10. Contact</h2>
      <p>Privacy questions or requests: philipsunday622@gmail.com</p>
    </LegalPage>
  );
}
