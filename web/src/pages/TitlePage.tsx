import { ArrowLeft, BookOpen, Film, Gamepad2, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteTitle } from '../api';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import ReviewCreateForm from '../components/ReviewCreateForm';
import ReviewList from '../components/ReviewList';
import TitleEditForm from '../components/TitleEditForm';
import { TitleImage } from '../components/TitleImage';
import { useAuth } from '../context/AuthContext';
import { useMyReview } from '../hooks/useMyReview';
import { useReviews } from '../hooks/useReviews';
import { useTitle } from '../hooks/useTitle';
import { getErrorMessage } from '../utils/error';
import styles from './TitlePage.module.css';

const TYPE_ICON = {
  movie: Film,
  game: Gamepad2,
  book: BookOpen,
} as const;

export default function TitlePage() {
  const [reviewsPage, setReviewsPage] = useState(1);
  const [editingTitle, setEditingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const previousLocation =
    (location.state as { from?: string } | null)?.from ?? '/';
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const titleId = id ? Number(id) : null;
  const { data: title, error, mutate } = useTitle(titleId);
  const {
    reviews,
    total,
    totalPages,
    currentPage,
    mutate: mutateReviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useReviews(titleId ?? undefined, reviewsPage, user?.id);
  const {
    data: myReview,
    error: myReviewError,
    isLoading: myReviewLoading,
    mutate: mutateMyReview,
  } = useMyReview(titleId, Boolean(user?.id));

  const refreshReviews = () => {
    void mutateReviews();
    void mutateMyReview();
    void mutate();
  };

  const canEdit = user?.id === title?.createdById;
  const handleBack = () => navigate(previousLocation, { replace: true });
  const handleDeleteTitle = async () => {
    if (!title) return;
    if (!window.confirm('Delete this title and all its reviews?')) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteTitle(title.id);
      navigate(previousLocation, { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: number }).status
        : undefined;

    return (
      <main>
        <Header />
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Back to titles</span>
        </button>
        {status === 404 ? (
          <p>Title not found.</p>
        ) : (
          <>
            <p>Error: {error.message}</p>
            <button type="button" onClick={() => mutate()}>
              Retry
            </button>
          </>
        )}
      </main>
    );
  }

  if (!title) {
    return (
      <main>
        <Header />
        <p>Loading...</p>
      </main>
    );
  }

  const Icon = TYPE_ICON[title.type];
  const canCreateReview =
    !!user?.id && !myReview && !myReviewLoading && !myReviewError;

  return (
    <main>
      <Header />
      <div className={styles.page}>
        <div className={styles.buttonPanel}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to titles</span>
          </button>
          {canEdit && (
            <div className={styles.ownerActions}>
              <button type="button" onClick={() => setEditingTitle(true)}>
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteTitle}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              {deleteError && <p role="alert">{deleteError}</p>}
            </div>
          )}
        </div>
        <div className={styles.details}>
          {editingTitle ? (
            <TitleEditForm
              title={title}
              onTitleEdit={() => {
                setEditingTitle(false);
                void mutate();
              }}
              onCancel={() => setEditingTitle(false)}
            />
          ) : (
            <>
              <div className={styles.poster}>
                <TitleImage imageUrl={title.imageUrl} type={title.type} />
              </div>

              <div className={styles.info}>
                <h1 id="title-heading" className={styles.heading}>
                  <span>{title.name}</span>
                  <span className={styles.type}>
                    <Icon size={24} aria-hidden="true" />
                    {title.releaseYear && <span>{title.releaseYear}</span>}
                  </span>
                </h1>

                <div className={styles.metaRow}>
                  <span className="rating-badge">
                    <Star size={16} fill="gold" />
                    {title.averageRating !== null
                      ? title.averageRating.toFixed(1)
                      : '—'}
                  </span>
                  <span>
                    {title.reviewCount}{' '}
                    {title.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                {title.description && (
                  <p className={styles.description}>{title.description}</p>
                )}
              </div>
            </>
          )}

          {!user && (
            <div className={styles.myReview}>
              <p>
                <Link to="/login" state={{ from: location.pathname }}>
                  Login
                </Link>{' '}
                or{' '}
                <Link to="/register" state={{ from: location.pathname }}>
                  Register
                </Link>{' '}
                to leave a review.
              </p>
            </div>
          )}

          {user && myReviewError && (
            <div className={styles.myReview}>
              <p role="alert">
                Could not check whether you have reviewed this title.{' '}
                <button type="button" onClick={() => void mutateMyReview()}>
                  Retry
                </button>
              </p>
            </div>
          )}

          {user && !myReviewError && myReviewLoading && (
            <div className={styles.myReview}>
              <h3>Your review</h3>
              <p>Loading...</p>
            </div>
          )}

          {user && !myReviewError && !myReviewLoading && myReview && (
            <div className={styles.myReview}>
              <h3>Your review</h3>
              <ReviewList
                reviews={[myReview]}
                onReviewsChanged={refreshReviews}
                variant="single"
              />
            </div>
          )}

          {canCreateReview && (
            <ReviewCreateForm
              titleId={title.id}
              onReviewsChanged={refreshReviews}
            />
          )}
        </div>

        <section className={styles.otherReviews}>
          <h2>Other reviews: {total}</h2>

          {reviewsLoading && <p>Loading reviews...</p>}

          {reviewsError && (
            <p>Failed to load reviews: {reviewsError.message}</p>
          )}

          {!reviewsError && !reviewsLoading && reviews.length === 0 && (
            <p>No other reviews yet.</p>
          )}

          {reviews.length > 0 && (
            <ReviewList reviews={reviews} onReviewsChanged={refreshReviews} />
          )}

          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setReviewsPage}
            />
          )}
        </section>
      </div>
    </main>
  );
}
