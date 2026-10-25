import { Link } from 'react-router';
import { Header } from '../components/layout/Header';

export default function NotFoundPage() {
  return (
    <main>
      <Header />
      <section className="page-section">
        <h2>Page not found</h2>
        <Link to="/">Back to titles</Link>
      </section>
    </main>
  );
}
