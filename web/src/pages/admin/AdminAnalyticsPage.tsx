import { Link } from 'react-router';
import useSWR from 'swr';
import { apiFetch } from '../../api/client';
import type { AnalyticsSummary } from '../../api/types';
import ActivityFeedSection from '../../components/admin/ActivityFeedSection';
import AdminNav from '../../components/admin/AdminNav';
import { Header } from '../../components/layout/Header';
import { getErrorMessage } from '../../utils/error';
import styles from './AdminAnalytics.module.css';

export default function AdminAnalyticsPage() {
  const { data, error, isLoading } = useSWR<AnalyticsSummary>(
    '/admin/analytics',
    apiFetch,
  );

  return (
    <main>
      <Header />
      <AdminNav />
      {error && (
        <div className="error-message">
          Failed to load analytics: {getErrorMessage(error)}
        </div>
      )}
      {isLoading && <p>Loading...</p>}
      {data && !data.enabled && (
        <p className={styles.note}>
          Request analytics is off: ANALYTICS_KEY is not set on the server.
        </p>
      )}

      {data && (
        <>
          <dl className={styles.stats}>
            {(
              [
                ['Requests, 24 h', data.day.requests],
                ['Visitors, 24 h', data.day.visitors],
                ['Signed-in users, 24 h', data.day.users],
                ['Requests, 7 days', data.week.requests],
                ['Visitors, 7 days', data.week.visitors],
                ['Signed-in users, 7 days', data.week.users],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className={styles.stat}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.section}>
            <h2>Most viewed titles, 7 days</h2>
            {data.topTitles.length === 0 ? (
              <p className={styles.note}>No views yet.</p>
            ) : (
              <ol className={styles.top}>
                {data.topTitles.map((title) => (
                  <li key={title.id}>
                    <Link to={`/titles/${title.id}`}>{title.name}</Link>
                    <span>{title.views}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={styles.section}>
            <h2>Recent activity</h2>
            <ActivityFeedSection showUser />
          </section>
        </>
      )}
    </main>
  );
}
