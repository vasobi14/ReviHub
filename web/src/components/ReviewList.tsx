import type { Review } from '../types';
import ReviewItem from './ReviewItem';
import styles from './ReviewList.module.css';

interface ReviewListProps {
  reviews: Review[];
  onReviewsChanged?: () => void;
  variant?: 'grid' | 'single';
}

export default function ReviewList({
  reviews,
  onReviewsChanged,
  variant = 'grid',
}: ReviewListProps) {
  const className =
    variant === 'grid' ? styles.list : `${styles.list} ${styles[variant]}`;

  return (
    <ul className={className}>
      {reviews.map((r: Review) => (
        <ReviewItem
          key={r.id}
          r={r}
          onReviewsChanged={onReviewsChanged}
          embedded={variant === 'single'}
        />
      ))}
    </ul>
  );
}
