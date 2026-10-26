import { useState } from 'react';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { getErrorMessage } from '../../utils/error';
import ActivityFeed from './ActivityFeed';
import styles from './ActivityFeedSection.module.css';

interface ActivityFeedSectionProps {
  // Only this user's requests; the whole site when omitted
  userId?: number;
  showUser?: boolean;
}

export default function ActivityFeedSection({
  userId,
  showUser,
}: ActivityFeedSectionProps) {
  const [technical, setTechnical] = useState(false);
  const { entries, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useActivityFeed(userId, technical);

  return (
    <>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={technical}
          onChange={(e) => setTechnical(e.target.checked)}
        />
        Show technical requests
      </label>

      {error && (
        <div className="error-message">
          Failed to load activity: {getErrorMessage(error)}
        </div>
      )}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ActivityFeed entries={entries} showUser={showUser} />
      )}

      {hasMore && (
        <button
          type="button"
          className={`button-text ${styles.more}`}
          onClick={loadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Loading...' : 'Load older'}
        </button>
      )}
    </>
  );
}
