import { BookOpen, Film, Gamepad2 } from 'lucide-react';

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

export function WorkImage({ imageUrl, type }: Props) {
  const apiUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : '';
  if (imageUrl) {
    return <img src={apiUrl + imageUrl} alt="" />;
  }

  const Icon = getTypeIcon(type);

  return (
    <div className="work-image-placeholder">
      <Icon size={48} />
    </div>
  );
}
