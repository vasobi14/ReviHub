import { createReview } from '../api';
import styles from './ReviewCreateForm.module.css';
import ReviewForm from './ReviewForm';

interface ReviewCreateFormProps {
  titleId: number;
  onReviewsChanged: () => void;
}

export default function ReviewCreateForm({
  titleId,
  onReviewsChanged,
}: ReviewCreateFormProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Your review</h3>
      <ReviewForm
        submitLabel="Post review"
        onSubmit={async (score, text) => {
          await createReview(titleId, score, text);
          onReviewsChanged();
        }}
      />
    </div>
  );
}
