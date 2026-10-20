import { Header } from '../components/Header';

export default function CookiePage() {
  return (
    <main>
      <Header />
      <section className="page-section">
        <h2>Cookie Policy</h2>
        <p>This site uses only strictly necessary cookies:</p>
        <p>We do not use analytics, advertising, or tracking cookies.</p>
      </section>
    </main>
  );
}
