import { useState } from 'react';
import { getErrorMessage } from '../../utils/error';
import StarRating from '../ui/StarRating';

interface ReviewFormProps {
  initialScore?: number;
  initialText?: string;
  submitLabel: string;
  onSubmit: (score: number, text: string) => Promise<void>;
  onCancel?: () => void;
}

export default function ReviewForm({
  initialScore = 5,
  initialText = '',
  submitLabel,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [score, setScore] = useState(initialScore);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(score, text);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-fields">
      <StarRating value={score} onChange={setScore} />
      <label className="field">
        <span className="field-label">Review</span>
        <textarea
          rows={3}
          placeholder="What did you think? (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {error && <div className="error-message">{error}</div>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
