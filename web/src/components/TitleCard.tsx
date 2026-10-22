import { BookOpen, Film, Gamepad2, StarIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { TitleListItem } from '../types';
import ReviewList from './ReviewList';
import styles from './TitleCard.module.css';
import { TitleImage } from './TitleImage';

interface TitleCardProps {
  title: TitleListItem;
  onReviewsChanged: () => void;
}

export default function TitleCard({ title }: TitleCardProps) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const TYPE_ICON = {
    movie: Film,
    game: Gamepad2,
    book: BookOpen,
  } as const;
  const Icon = TYPE_ICON[title.type];
  return (
    <li className={styles.card}>
      <h3 className={styles.name}>
        <Link to={`/titles/${title.id}`} state={{ from }}>
          {title.name}
        </Link>
        <Icon size={20} aria-hidden="true" />
        {title.releaseYear ? `${title.releaseYear} ` : ''}
      </h3>
      <TitleImage imageUrl={title.imageUrl} type={title.type} />
      {title.latestReviews.length !== 0 && (
        <div>
          <strong>
            <span className="rating-badge">
              <StarIcon size={20} fill="gold" />{' '}
              {title.averageRating?.toFixed(1) ?? '—'}
              {' by '}
              {title.reviewCount} reviews
            </span>
          </strong>
        </div>
      )}
      <div className={styles.description}>{title.description}</div>
      {title.latestReviews.length > 0 ? (
        <>
          <h4>Latest reviews</h4>
          <ReviewList reviews={title.latestReviews} variant="compact" />
          <Link
            className="button-link"
            to={`/titles/${title.id}`}
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
            to={`/titles/${title.id}`}
            state={{ from }}
          >
            Be the first →
          </Link>
        </>
      )}
    </li>
  );
}
