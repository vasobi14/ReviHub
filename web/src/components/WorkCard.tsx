import { BookOpen, Film, Gamepad2, StarIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { WorkListItem } from '../types';
import ReviewList from './ReviewList';
import { WorkImage } from './WorkImage';

interface WorkCardProps {
  work: WorkListItem;
  onReviewsChanged: () => void;
}

export default function WorkCard({ work }: WorkCardProps) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const TYPE_ICON = {
    movie: Film,
    game: Gamepad2,
    book: BookOpen,
  } as const;
  const Icon = TYPE_ICON[work.type];
  return (
    <li className="work-card">
      <h3 className="work-card-title">
        <Link to={`/works/${work.id}`} state={{ from }}>
          {work.title}
        </Link>
        <Icon size={20} aria-hidden="true" />
        {work.releaseYear ? `${work.releaseYear} ` : ''}
      </h3>
      <div className="work-image">
        <WorkImage imageUrl={work.imageUrl} type={work.type} />
      </div>
      {work.latestReviews.length !== 0 && (
        <div className="work-meta">
          <strong>
            <span className="rating-badge">
              <StarIcon size={20} fill="gold" />{' '}
              {work.averageRating?.toFixed(1) ?? '—'}
              {' by '}
              {work.reviewCount} reviews
            </span>
          </strong>
        </div>
      )}
      <div className="work-description">{work.description}</div>
      {work.latestReviews.length > 0 ? (
        <>
          <h4>Latest reviews</h4>
          <ReviewList
            reviews={work.latestReviews}
            className="review-list review-list-compact"
          />
          <Link
            className="button-link"
            to={`/works/${work.id}`}
            state={{ from }}
          >
            Read more →
          </Link>
        </>
      ) : (
        <>
          <p>No reviews yet.</p>
          <Link
            className="button-link"
            to={`/works/${work.id}`}
            state={{ from }}
          >
            Be the first →
          </Link>
        </>
      )}
    </li>
  );
}
