import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Privacy Policy | CampusAI',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 17, 2026">
      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your full name and email address, and your password
          (which is handled by Firebase Authentication, so we never see or store it in readable
          form).
        </li>
        <li>
          <strong>What you type into the AI:</strong> the questions you ask in the chat and the
          notes you paste to be summarized.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To create your account and log you in.</li>
        <li>To show your name in the app.</li>
        <li>To send your questions and notes to the AI so it can reply or summarize.</li>
        <li>To send account emails, such as password reset and email verification.</li>
      </ul>

      <h2>3. Who handles your data</h2>
      <ul>
        <li>
          <strong>Google Firebase</strong> handles sign up, login and password reset.
        </li>
        <li>
          <strong>Google Gemini</strong> receives your questions and pasted notes in order to
          produce answers and summaries.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. What we do not do</h2>
      <p>
        At this stage, CampusAI does not save your chat messages or pasted notes in its own
        database. If we add saved summaries or chat history later, we will update this page.
      </p>

      <h2>5. Keeping your data safe</h2>
      <p>
        We use trusted services and keep secret keys on the server, away from your browser. No
        online service can promise perfect security, so please do not paste highly sensitive
        information into the chat.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>You can ask us to delete your account and its data.</li>
        <li>You can ask what information we hold about you.</li>
        <li>You can stop using CampusAI at any time.</li>
      </ul>

      <h2>7. Children</h2>
      <p>
        CampusAI is meant for university students. If you believe a child has created an
        account, please contact us so we can remove it.
      </p>

      <h2>8. Contact</h2>
      <p>Privacy questions or requests: [philipsunday622@gmail.com]</p>
    </LegalPage>
  );
}