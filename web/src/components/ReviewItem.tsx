import { Pencil, StarIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteReview, updateReview } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Review } from '../types';
import { getErrorMessage } from '../utils/error';
import Avatar from './Avatar';
import styles from './ReviewItem.module.css';
import StarRating from './StarRating';

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
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingForm, setEditingForm] = useState({ score: 5, text: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = user?.id && r.user?.id === user.id;

  const handleSaveReview = async () => {
    if (!editing || !onReviewsChanged) return;
    setSaving(true);
    setError('');
    try {
      await updateReview(r.id, editingForm);
      setEditing(false);
      onReviewsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEditReview = () => {
    setEditing(true);
    setError('');
    setEditingForm({ score: r.score, text: r.text || '' });
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
          <div className="form-stack">
            <StarRating
              value={editingForm.score}
              onChange={(score) =>
                setEditingForm((prev) => ({ ...prev, score }))
              }
            />
            <div>
              <label>
                Text
                <br />
                <textarea
                  rows={2}
                  value={editingForm.text}
                  onChange={(e) =>
                    setEditingForm((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  className="full-width"
                />
              </label>
            </div>
            <div className="inline-actions">
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
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

            {onReviewsChanged && canEdit && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleEditReview}
                  aria-label="Edit review"
                  title="Edit review"
                >
                  <Pencil size={16} />
                </button>
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
        </>
      )}
    </li>
  );
}
