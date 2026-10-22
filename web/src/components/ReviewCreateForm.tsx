import { useState } from 'react';
import { createReview } from '../api';
import { getErrorMessage } from '../utils/error';
import styles from './ReviewCreateForm.module.css';
import StarRating from './StarRating';

interface ReviewCreateFormProps {
  titleId: number;
  onReviewsChanged: () => void;
}

export default function ReviewCreateForm({
  titleId,
  onReviewsChanged,
}: ReviewCreateFormProps) {
  const [reviewForm, setReviewForm] = useState({ score: 5, text: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateReview = async () => {
    setSaving(true);
    setError('');
    try {
      await createReview(titleId, Number(reviewForm.score), reviewForm.text);
      setReviewForm({ score: 5, text: '' });
      onReviewsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panel}>
      <h3>Add review</h3>
      <div className="form-stack form-stack-narrow">
        <StarRating
          value={reviewForm.score}
          onChange={(score) => setReviewForm((prev) => ({ ...prev, score }))}
        />
        <div>
          <label>
            Text
            <br />
            <textarea
              rows={2}
              value={reviewForm.text}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, text: e.target.value }))
              }
              className="full-width"
            />
          </label>
        </div>
        <button type="button" onClick={handleCreateReview} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
