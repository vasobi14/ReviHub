import { Header } from '../components/Header';

export default function PrivacyPage() {
  return (
    <main>
      <Header />
      <section className="page-section">
        <h2>Privacy Policy</h2>
        <p>
          This site collects only the data you provide during registration
          (email, name).
        </p>
        <p>
          Authentication uses a secure cookie for session management. No
          analytics or tracking cookies are used.
        </p>
      </section>
    </main>
  );
}
