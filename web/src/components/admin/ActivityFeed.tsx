import { Link } from 'react-router';
import type { ActivityEntry } from '../../api/types';
import styles from './ActivityFeed.module.css';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// Turns a logged request into a readable action
function describe(entry: ActivityEntry) {
  const failed = entry.status >= 400;
  switch (`${entry.method} ${entry.route}`) {
    case 'GET /titles': {
      const query = new URLSearchParams(entry.path.split('?')[1]).get('q');
      return query ? `Searched for “${query}”` : 'Browsed the catalog';
    }
    case 'GET /titles/:id':
      return `Viewed ${entry.titleName ?? 'a deleted title'}`;
    case 'POST /titles':
      return failed ? 'Tried to add a title' : 'Added a title';
    case 'PUT /titles/:id':
      return 'Edited a title';
    case 'DELETE /titles/:id':
      return 'Deleted a title';
    case 'POST /reviews':
      return failed ? 'Tried to post a review' : 'Posted a review';
    case 'PUT /reviews/:id':
      return 'Edited a review';
    case 'DELETE /reviews/:id':
      return 'Deleted a review';
    case 'POST /auth/register':
      return failed ? 'Failed to register' : 'Registered';
    case 'POST /auth/login':
      return failed ? 'Failed to log in' : 'Logged in';
    case 'POST /auth/demo':
      return failed ? 'Used an invalid demo link' : 'Opened the demo';
    case 'POST /auth/logout':
      return 'Logged out';
    case 'POST /auth/verify-email':
      return failed ? 'Entered a wrong code' : 'Verified the email';
    case 'DELETE /admin/users/:id':
      return 'Deleted a user';
    default:
      return (
        TECHNICAL[`${entry.method} ${entry.route}`] ??
        `${entry.method} ${entry.path}`
      );
  }
}

// Requests the site makes on its own, not user actions
const TECHNICAL: Record<string, string> = {
  'POST /auth/refresh': 'Refreshed the session',
  'GET /auth/me': 'Loaded the profile',
  'POST /auth/resend-verification': 'Asked for a new code',
  'GET /reviews': 'Loaded reviews',
  'GET /reviews/mine': 'Checked their own review',
  'GET /reviews/:id': 'Loaded a review',
  'GET /admin/users': 'Opened the user list',
};

const isTechnical = (entry: ActivityEntry) =>
  `${entry.method} ${entry.route}` in TECHNICAL;

// The title page link for title views, e.g. "/titles/12"
function titleLink(entry: ActivityEntry) {
  return entry.route === '/titles/:id' && entry.titleName
    ? entry.path.split('?')[0]
    : null;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
  // Shows who made each request: needed in the general feed, not on a single user's page
  showUser?: boolean;
}

const SLOW_MS = 1000;

export default function ActivityFeed({ entries, showUser }: ActivityFeedProps) {
  if (entries.length === 0) {
    return <p className={styles.empty}>No activity yet.</p>;
  }

  return (
    <ol className={styles.feed}>
      {entries.map((entry) => {
        const link = titleLink(entry);
        return (
          <li key={entry.id} className={styles.entry}>
            <time className={styles.time} dateTime={entry.createdAt}>
              {timeFormat.format(new Date(entry.createdAt))}
            </time>
            <div className={styles.body}>
              <span
                className={
                  entry.status >= 400
                    ? styles.failed
                    : isTechnical(entry)
                      ? styles.technical
                      : undefined
                }
              >
                {link ? (
                  <Link to={link}>{describe(entry)}</Link>
                ) : (
                  describe(entry)
                )}
              </span>
              <span className={styles.meta}>
                {showUser &&
                  (entry.userId ? (
                    <Link to={`/admin/users/${entry.userId}`}>
                      User #{entry.userId}
                    </Link>
                  ) : (
                    'Guest'
                  ))}
                {!showUser && entry.userId === null && (
                  <span className={styles.badge}>before login</span>
                )}
                <span
                  className={
                    entry.durationMs >= SLOW_MS ? styles.failed : undefined
                  }
                >
                  {entry.status} · {entry.durationMs} ms
                </span>
                <span>{entry.ip ?? 'unknown IP'}</span>
                <span className={styles.agent} title={entry.userAgent ?? ''}>
                  {entry.userAgent ?? 'unknown browser'}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
