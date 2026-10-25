import type { TitleType } from '../../api/types';
import styles from './TitleImage.module.css';
import { TITLE_TYPES } from './titleTypes';

interface Props {
  imageUrl: string | null;
  type: TitleType;
}

export function TitleImage({ imageUrl, type }: Props) {
  const Icon = TITLE_TYPES[type].icon;

  return (
    <div className={`${styles.frame} ${styles[type]}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          <Icon className={styles.icon} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
