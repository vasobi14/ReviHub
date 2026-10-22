import { StarIcon } from 'lucide-react';
import { useState } from 'react';
import styles from './StarRating.module.css';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <fieldset className={styles.rating}>
      <legend>Rating</legend>
      {SCORES.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} out of 10`}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <StarIcon
            color={n <= value ? 'gold' : 'grey'}
            fill={n <= (hover || value) ? 'gold' : ''}
          />
        </button>
      ))}
      <br />
      You select {value} out of 10
    </fieldset>
  );
}
