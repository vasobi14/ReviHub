import { Pencil, StarIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteReview, updateReview } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Review } from '../types';
import { getErrorMessage } from '../utils/error';
import Avatar from './Avatar';

interface ReviewItemProps {
  r: Review;
  onReviewsChanged?: () => void;
}

export default function ReviewItem({ r, onReviewsChanged }: ReviewItemProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingForm, setEditingForm] = useState({ score: 5, text: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);

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
    <li className="review-item">
      {editing ? (
        <div className="edit-panel">
          <div className="form-stack">
            <fieldset className="star-rating">
              <legend>Rating</legend>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Rate ${n} out of 10`}
                  aria-pressed={n === editingForm.score}
                  onClick={() =>
                    setEditingForm((prev) => ({ ...prev, score: n }))
                  }
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                >
                  <StarIcon
                    color={n <= editingForm.score ? 'gold' : 'grey'}
                    fill={n <= (hover || editingForm.score) ? 'gold' : ''}
                  />
                </button>
              ))}
              <br />
              You select {editingForm.score} out of 10
            </fieldset>
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
          <div className="review-header">
            <div className="review-author">
              <Avatar user={r.user} size="sm" />
              <span className="review-author-name">
                <Avatar user={r.user} size="sm" />{' '}
                {r.user.name ? r.user.name : `User #${r.user.id}`}
              </span>
            </div>

            {onReviewsChanged && canEdit && (
              <div className="inline-actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={handleEditReview}
                  aria-label="Edit review"
                  title="Edit review"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={handleDeleteReview}
                  aria-label="Delete review"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="review-score">
              <StarIcon size={16} fill="gold" />
              <span>{r.score}/10</span>
            </div>
          </div>

          {r.text && <p className="review-text">{r.text}</p>}
        </>
      )}
    </li>
  );
}
