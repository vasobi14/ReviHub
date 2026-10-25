import { Pencil, StarIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteReview, updateReview } from '../../api/client';
import type { Review } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';
import Avatar from '../ui/Avatar';
import ReviewForm from './ReviewForm';
import styles from './ReviewItem.module.css';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

interface ReviewItemProps {
  r: Review;
  onReviewsChanged?: () => void;
  embedded?: boolean;
}

export default function ReviewItem({
  r,
  onReviewsChanged,
  embedded = false,
}: ReviewItemProps) {
  const { user, adminMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const isAuthor = user?.id === r.user.id;
  const canDelete = isAuthor || adminMode;

  const handleEditReview = () => {
    setEditing(true);
    setError('');
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Delete this review?')) return;
    if (!onReviewsChanged) return;
    setError('');
    try {
      await deleteReview(r.id);
      setEditing(false);
      onReviewsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <li
      className={embedded ? `${styles.item} ${styles.embedded}` : styles.item}
    >
      {editing ? (
        <div className={styles.editPanel}>
          <ReviewForm
            initialScore={r.score}
            initialText={r.text ?? ''}
            submitLabel="Save"
            onSubmit={async (score, text) => {
              await updateReview(r.id, { score, text });
              setEditing(false);
              onReviewsChanged?.();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.author}>
              <Avatar user={r.user} size="sm" />
              <span className={styles.authorName}>
                <Avatar user={r.user} size="sm" />{' '}
                {r.user.name ? r.user.name : `User #${r.user.id}`}
              </span>
            </div>

            <div className={styles.score}>
              <StarIcon size={16} fill="gold" />
              <span>{r.score}/10</span>
            </div>

            <time className={styles.date} dateTime={r.createdAt}>
              {dateFormat.format(new Date(r.createdAt))}
            </time>

            {onReviewsChanged && canDelete && (
              <div className={styles.actions}>
                {isAuthor && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={handleEditReview}
                    aria-label="Edit review"
                    title="Edit review"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleDeleteReview}
                  aria-label="Delete review"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {r.text && <p className={styles.text}>{r.text}</p>}
          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </li>
  );
}
