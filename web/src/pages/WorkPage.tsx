import { ArrowLeft, BookOpen, Film, Gamepad2, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteWork } from '../api';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import ReviewCreateForm from '../components/ReviewCreateForm';
import ReviewItem from '../components/ReviewItem';
import ReviewList from '../components/ReviewList';
import WorkEditForm from '../components/WorkEditForm';
import { WorkImage } from '../components/WorkImage';
import { useAuth } from '../context/AuthContext';
import { useMyReview } from '../hooks/useMyReview';
import { useReviews } from '../hooks/useReviews';
import { useWork } from '../hooks/useWork';
import { getErrorMessage } from '../utils/error';

const TYPE_ICON = {
  movie: Film,
  game: Gamepad2,
  book: BookOpen,
} as const;

export default function WorkPage() {
  const [reviewsPage, setReviewsPage] = useState(1);
  const [editingWork, setEditingWork] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const previousLocation =
    (location.state as { from?: string } | null)?.from ?? '/';
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const workId = id ? Number(id) : null;
  const { data: work, error, mutate } = useWork(workId);
  const {
    reviews,
    total,
    totalPages,
    currentPage,
    mutate: mutateReviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useReviews(workId ?? undefined, reviewsPage, user?.id);
  const {
    data: myReview,
    error: myReviewError,
    isLoading: myReviewLoading,
    mutate: mutateMyReview,
  } = useMyReview(workId, Boolean(user?.id));

  const refreshReviews = () => {
    void mutateReviews();
    void mutateMyReview();
    void mutate();
  };

  const canEdit = user?.id === work?.createdById;
  const handleBack = () => navigate(previousLocation, { replace: true });
  const handleDeleteWork = async () => {
    if (!work) return;
    if (!window.confirm('Delete this work and all its reviews?')) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteWork(work.id);
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
        <button type="button" className="work-back-button" onClick={handleBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Back to works</span>
        </button>
        {status === 404 ? (
          <p>Work not found.</p>
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

  if (!work) {
    return (
      <main>
        <Header />
        <p>Loading...</p>
      </main>
    );
  }

  const Icon = TYPE_ICON[work.type];
  const canCreateReview =
    !!user?.id && !myReview && !myReviewLoading && !myReviewError;

  return (
    <main>
      <Header />
      <div className="work-page">
        <div className="work-page-button-panel">
          <button
            type="button"
            className="work-back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Back to works</span>
          </button>
          {canEdit && (
            <div className="work-owner-actions">
              <button type="button" onClick={() => setEditingWork(true)}>
                Edit work
              </button>
              <button
                type="button"
                onClick={handleDeleteWork}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete work'}
              </button>
              {deleteError && <p role="alert">{deleteError}</p>}
            </div>
          )}
        </div>
        <div className="work-details-main">
          {editingWork ? (
            <WorkEditForm
              work={work}
              onWorkEdit={() => {
                setEditingWork(false);
                void mutate();
              }}
              onCancel={() => setEditingWork(false)}
            />
          ) : (
            <>
              <div className="work-details-poster">
                <div className="work-image">
                  <WorkImage imageUrl={work.imageUrl} type={work.type} />
                </div>
              </div>

              <div className="work-details-info">
                <h1 id="work-title" className="work-page-title">
                  <span>{work.title}</span>
                  <span className="work-page-title-type">
                    <Icon size={24} aria-hidden="true" />
                    {work.releaseYear && <span>{work.releaseYear}</span>}
                  </span>
                </h1>

                <div className="work-meta-row">
                  <span className="rating-badge">
                    <Star size={16} fill="gold" />
                    {work.averageRating !== null
                      ? work.averageRating.toFixed(1)
                      : '—'}
                  </span>
                  <span>
                    {work.reviewCount}{' '}
                    {work.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                {work.description && (
                  <p className="work-description">{work.description}</p>
                )}
              </div>
            </>
          )}

          {!user && (
            <div className="my-review-card">
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
            <div className="my-review-card">
              <p role="alert">
                Could not check whether you have reviewed this work.{' '}
                <button type="button" onClick={() => void mutateMyReview()}>
                  Retry
                </button>
              </p>
            </div>
          )}

          {user && !myReviewError && myReviewLoading && (
            <div className="my-review-card">
              <h3>Your review</h3>
              <p>Loading...</p>
            </div>
          )}

          {user && !myReviewError && !myReviewLoading && myReview && (
            <div className="my-review-card">
              <h3>Your review</h3>
              <ul className="review-list review-list-single">
                <ReviewItem r={myReview} onReviewsChanged={refreshReviews} />
              </ul>
            </div>
          )}

          {canCreateReview && (
            <ReviewCreateForm
              workId={work.id}
              onReviewsChanged={refreshReviews}
            />
          )}
        </div>

        <section className="work-reviews-list">
          <h2>Other reviews: {total}</h2>

          {reviewsLoading && <p>Loading reviews...</p>}

          {reviewsError && (
            <p>Failed to load reviews: {reviewsError.message}</p>
          )}

          {!reviewsError && !reviewsLoading && reviews.length === 0 && (
            <p>No other reviews yet.</p>
          )}

          {reviews.length > 0 && (
            <ReviewList
              reviews={reviews}
              onReviewsChanged={refreshReviews}
              className="review-list"
            />
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
