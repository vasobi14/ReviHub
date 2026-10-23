import { BookOpen, CircleStar, Film, Gamepad2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import SegmentedControl from '../components/SegmentedControl';
import TitleCard, { TitleCardSkeleton } from '../components/TitleCard';
import { useAuth } from '../context/AuthContext';
import { useTitles } from '../hooks/useTitles';
import type { TitleSort } from '../types';
import styles from './HomePage.module.css';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: CircleStar },
  { value: 'movie', label: 'Movies', icon: Film },
  { value: 'game', label: 'Games', icon: Gamepad2 },
  { value: 'book', label: 'Books', icon: BookOpen },
];

const SORTS: { value: TitleSort; label: string }[] = [
  { value: 'new', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top rated' },
];

// One page of placeholders
const SKELETONS = Array.from({ length: 12 }, (_, i) => `skeleton-${i}`);

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') ?? 'all';
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  const sort =
    SORTS.find((s) => s.value === searchParams.get('sort'))?.value ?? 'new';
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [titleFilter, setTitleFilter] = useState(searchQuery);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(key, value);
          else next.delete(key);
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    setTitleFilter(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const query = titleFilter.trim();
    if (query === searchQuery) return;

    const timeout = setTimeout(() => setParam('q', query || null), 250);
    return () => clearTimeout(timeout);
  }, [titleFilter, searchQuery, setParam]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (newPage === 1) next.delete('page');
        else next.set('page', String(newPage));
        return next;
      },
      { replace: true }
    );
  };

  const { titles, total, totalPages, currentPage, error, mutate, isLoading } =
    useTitles(typeFilter, searchQuery, page, sort);

  const canEdit = !!user?.id;

  const hasFilters = typeFilter !== 'all' || searchQuery !== '';

  return (
    <main>
      <Header />
      <section className={`page-section ${styles.filters}`}>
        <div className={styles.topRow}>
          <fieldset className={styles.categories} aria-label="Category">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === typeFilter}
                onClick={() => setParam('type', value === 'all' ? null : value)}
                className={styles.category}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            ))}
          </fieldset>
          {canEdit && (
            <Link
              to="/titles/new"
              className={`button-link button-primary ${styles.addButton}`}
            >
              <Plus size={18} aria-hidden="true" />
              Add title
            </Link>
          )}
        </div>

        <div className={styles.searchRow}>
          <input
            type="search"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            placeholder="Search by name..."
            aria-label="Search by name"
            className={styles.search}
          />
          <SegmentedControl
            label="Sort by"
            hideLabel
            options={SORTS}
            value={sort}
            onChange={(value) =>
              setParam('sort', value === 'new' ? null : value)
            }
            className={styles.sort}
          />
          <span className={styles.count} aria-live="polite">
            {!(isLoading && titles.length === 0) &&
              `${total} ${total === 1 ? 'title' : 'titles'}`}
          </span>
        </div>
      </section>

      <section>
        {error && (
          <p>
            Failed to load: {error.message}{' '}
            <button type="button" onClick={() => mutate()}>
              Retry
            </button>
          </p>
        )}

        {!error &&
          !isLoading &&
          titles.length === 0 &&
          (hasFilters ? (
            <p>Nothing matches your search.</p>
          ) : (
            <p>
              No titles yet.{' '}
              {canEdit && <Link to="/titles/new">Add the first one →</Link>}
            </p>
          ))}
        <ul className={styles.titleList} aria-busy={isLoading}>
          {isLoading && titles.length === 0
            ? SKELETONS.map((key) => <TitleCardSkeleton key={key} />)
            : titles.map((title) => <TitleCard key={title.id} title={title} />)}
        </ul>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}
