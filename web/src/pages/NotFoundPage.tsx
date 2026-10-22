import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

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
