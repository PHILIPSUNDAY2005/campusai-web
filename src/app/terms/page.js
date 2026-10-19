import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Terms and Conditions | CampusAI',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updated="October 17, 2026">
      <h2>1. About CampusAI</h2>
      <p>
        CampusAI is a study assistant built as a university semester project. It helps students
        understand course topics and summarize lecture notes using artificial intelligence. By
        creating an account or using CampusAI, you agree to these terms.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must give a correct email address and keep your password private.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>Tell us if you think someone else has used your account.</li>
      </ul>

      <h2>3. Using the AI</h2>
      <ul>
        <li>
          The AI can make mistakes. Always check important information against your lecture
          notes, textbooks and lecturers before you rely on it.
        </li>
        <li>
          CampusAI is a study aid. It does not replace your lecturers, and it does not give
          professional advice.
        </li>
        <li>
          Use CampusAI honestly. Follow your school&apos;s academic integrity rules, and do not
          present AI-written work as your own where your school does not allow it.
        </li>
      </ul>

      <h2>4. What you must not do</h2>
      <ul>
        <li>Do not use CampusAI for anything illegal, harmful or abusive.</li>
        <li>Do not try to break, overload or gain unauthorized access to the service.</li>
        <li>Do not paste other people&apos;s private or sensitive information into the chat.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        The questions you type and the notes you paste are sent to an AI service to produce a
        reply or a summary. Do not paste anything you are not allowed to share. You keep
        ownership of your own notes.
      </p>

      <h2>6. Availability</h2>
      <p>
        CampusAI is a student project and is provided as it is. It may change, be interrupted
        or stop working at any time, and we cannot promise it will always be available or free
        of errors.
      </p>

      <h2>7. Limits of responsibility</h2>
      <p>
        We are not responsible for losses or grades that result from relying on AI answers.
        Nothing in these terms limits any rights you have under the law.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms. If we make an important change, we will update the date at
        the top of this page. Continuing to use CampusAI means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>Questions about these terms: [philipsunday622@gmail.com]</p>
    </LegalPage>
  );
}