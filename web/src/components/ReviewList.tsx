import type { Review } from '../types';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
  reviews: Review[];
  onReviewsChanged?: () => void;
  className?: string;
}

export default function ReviewList({
  reviews,
  onReviewsChanged,
  className,
}: ReviewListProps) {
  return (
    <ul className={className ?? 'review-list'}>
      {reviews.map((r: Review) => {
        return (
          <ReviewItem key={r.id} r={r} onReviewsChanged={onReviewsChanged} />
        );
      })}
    </ul>
  );
}
