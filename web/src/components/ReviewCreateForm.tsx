import { StarIcon } from 'lucide-react';
import { useState } from 'react';
import { createReview } from '../api';
import { getErrorMessage } from '../utils/error';

interface ReviewCreateFormProps {
  workId: number;
  onReviewsChanged: () => void;
}

export default function ReviewCreateForm({
  workId,
  onReviewsChanged,
}: ReviewCreateFormProps) {
  const [reviewForm, setReviewForm] = useState({ score: 5, text: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);

  const handleCreateReview = async () => {
    setSaving(true);
    setError('');
    try {
      await createReview(workId, Number(reviewForm.score), reviewForm.text);
      setReviewForm({ score: 5, text: '' });
      onReviewsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review-panel">
      <h3>Add review</h3>
      <div className="form-stack form-stack-narrow">
        <fieldset className="star-rating">
          <legend>Rating</legend>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} out of 10`}
              aria-pressed={n === reviewForm.score}
              onClick={() => setReviewForm((prev) => ({ ...prev, score: n }))}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
            >
              <StarIcon
                color={n <= reviewForm.score ? 'gold' : 'grey'}
                fill={n <= (hover || reviewForm.score) ? 'gold' : ''}
              />
            </button>
          ))}
          <br />
          You select {reviewForm.score} out of 10
        </fieldset>
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
