import { useParams } from 'react-router';
import useSWR from 'swr';
import { apiFetch } from '../../api/client';
import type { UserSummary } from '../../api/types';
import ActivityFeedSection from '../../components/admin/ActivityFeedSection';
import AdminNav from '../../components/admin/AdminNav';
import { Header } from '../../components/layout/Header';
import Avatar from '../../components/ui/Avatar';
import { getErrorMessage } from '../../utils/error';
import styles from './AdminAnalytics.module.css';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function AdminUserPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading } = useSWR<UserSummary>(
    `/admin/users/${id}`,
    apiFetch,
  );

  return (
    <main>
      <Header />
      <AdminNav />
      {error && (
        <div className="error-message">
          Failed to load the user: {getErrorMessage(error)}
        </div>
      )}
      {isLoading && <p>Loading...</p>}

      {data && (
        <>
          <div className={styles.user}>
            <Avatar user={data.user} size="lg" />
            <div>
              <h1 className={styles.userName}>
                {data.user.name || `User #${data.user.id}`}
              </h1>
              <p className={styles.note}>{data.user.email}</p>
            </div>
          </div>

          <dl className={styles.stats}>
            {(
              [
                ['Joined', dateFormat.format(new Date(data.user.createdAt))],
                [
                  'Last seen',
                  data.lastSeen
                    ? dateFormat.format(new Date(data.lastSeen))
                    : 'Never',
                ],
                ['Requests, 90 days', data.requests],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className={styles.stat}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.section}>
            <h2>Activity</h2>
            <p className={styles.note}>
              Includes guest visits from the same browser and network before
              logging in.
            </p>
            <ActivityFeedSection userId={data.user.id} />
          </section>
        </>
      )}
    </main>
  );
}
