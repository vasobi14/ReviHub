import { StarIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import type { TitleListItem } from '../../api/types';
import styles from './TitleCard.module.css';
import { TitleImage } from './TitleImage';
import { TITLE_TYPES } from './titleTypes';

interface TitleCardProps {
  title: TitleListItem;
}

// Placeholder with the card's shape, shown while the catalog loads
export function TitleCardSkeleton() {
  return (
    <li className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <div className={`${styles.bone} ${styles.boneCover}`} />
      <div className={styles.bone} style={{ width: '70%' }} />
      <div className={styles.bone} style={{ width: '45%' }} />
      <div className={styles.bone} style={{ width: '55%' }} />
      <div className={styles.bone} style={{ width: '85%' }} />
    </li>
  );
}

export default function TitleCard({ title }: TitleCardProps) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const { icon: Icon, label } = TITLE_TYPES[title.type];

  return (
    <li className={styles.card}>
      <div className={styles.cover}>
        <TitleImage imageUrl={title.imageUrl} type={title.type} />
      </div>
      <h3 className={styles.name}>
        <Link to={`/titles/${title.id}`} state={{ from }}>
          {title.name}
        </Link>
      </h3>
      <p className={styles.meta}>
        <Icon size={16} aria-hidden="true" />
        {label}
        {title.releaseYear && ` · ${title.releaseYear}`}
      </p>
      <p className={styles.stats}>
        {title.reviewCount > 0 ? (
          <>
            <span className={styles.rating}>
              <StarIcon size={18} fill="gold" />
              {title.averageRating?.toFixed(1)}
            </span>
            {title.reviewCount} {title.reviewCount === 1 ? 'review' : 'reviews'}
          </>
        ) : (
          'No reviews yet'
        )}
      </p>
      {title.description && (
        <p className={styles.description}>{title.description}</p>
      )}
    </li>
  );
}
