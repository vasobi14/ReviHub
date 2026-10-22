import { BookOpen, Film, Gamepad2 } from 'lucide-react';
import styles from './TitleImage.module.css';

interface Props {
  imageUrl: string | null;
  type: string;
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'movie':
      return Film;

    case 'game':
      return Gamepad2;

    case 'book':
      return BookOpen;

    default:
      return Film;
  }
}

export function TitleImage({ imageUrl, type }: Props) {
  const Icon = getTypeIcon(type);

  return (
    <div className={styles.frame}>
      {imageUrl ? (
        <img src={imageUrl} alt="" />
      ) : (
        <div className={styles.placeholder}>
          <Icon size={48} />
        </div>
      )}
    </div>
  );
}
