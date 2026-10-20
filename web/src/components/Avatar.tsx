import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  user: { id: number; name: string | null };
  size?: 'sm' | 'md' | 'lg';
}

const HUE_STEP = 137; // Golden angle for color distribution
const COMPLEMENT = 180; // Complementary hue for text color

const SIZE_ICON_PX = {
  sm: 14,
  md: 18,
  lg: 28,
} as const;

export default function Avatar({ user, size = 'sm' }: AvatarProps) {
  const hue = (user.id * HUE_STEP) % 360;
  const complementHue = (hue + COMPLEMENT) % 360;

  const bg = `hsl(${hue}, 60%, 45%)`;
  const fg = `hsl(${complementHue}, 60%, 45%)`;

  const firstLetter = user.name ? [...user.name.trim()][0] : null;
  const showLetter = !!firstLetter;

  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {showLetter ? (
        <span>{firstLetter}</span>
      ) : (
        <UserIcon size={SIZE_ICON_PX[size]} />
      )}
    </div>
  );
}
