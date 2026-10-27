import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import useSWR from 'swr';
import { apiFetch, deleteAdminUser } from '../../api/client';
import type { AdminUser } from '../../api/types';
import AdminNav from '../../components/admin/AdminNav';
import { Header } from '../../components/layout/Header';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';
import styles from './AdminPage.module.css';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function AdminPage() {
  const { user } = useAuth();
  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminUser[]>('/admin/users', apiFetch);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const search = query.trim().toLowerCase();
  const visibleUsers = (users ?? []).filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search),
  );

  const handleDelete = async (target: AdminUser) => {
    const { titles, reviews } = target._count;
    const confirmed = window.confirm(
      `Delete ${target.email} with ${titles} titles and ${reviews} reviews? This cannot be undone.`,
    );
    if (!confirmed) return;

    setActionError('');
    setDeletingId(target.id);
    try {
      await deleteAdminUser(target.id);
      await mutate();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main>
      <Header />
      <AdminNav />
      <section className={styles.page}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Users</h1>
            <p className={styles.lead}>
              Deleting a user also removes their titles and reviews.
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name..."
            aria-label="Search users"
            className={styles.search}
          />
        </div>

        {error && (
          <div className="error-message">
            Failed to load users: {getErrorMessage(error)}
          </div>
        )}
        {actionError && <div className="error-message">{actionError}</div>}
        {isLoading && <p>Loading...</p>}

        {users && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className={styles.number}>Titles</th>
                  <th className={styles.number}>Reviews</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.user}>
                        <Avatar user={u} size="sm" />
                        <div>
                          <div className={styles.name}>
                            <Link to={`/admin/users/${u.id}`}>
                              {u.name || `User #${u.id}`}
                            </Link>
                          </div>
                          <div className={styles.email}>
                            {u.email}
                            {!u.emailVerified && (
                              <span className={styles.badge}>unverified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === 'ADMIN' && (
                        <span className={styles.adminBadge}>Admin</span>
                      )}
                      {u.role === 'DEMO' && 'Demo'}
                      {u.role === 'USER' && 'User'}
                    </td>
                    <td className={styles.nowrap}>
                      {dateFormat.format(new Date(u.createdAt))}
                    </td>
                    <td className={styles.number}>{u._count.titles}</td>
                    <td className={styles.number}>{u._count.reviews}</td>
                    <td className={styles.actions}>
                      {u.role !== 'ADMIN' && u.id !== user?.id && (
                        <button
                          type="button"
                          className={styles.delete}
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          {deletingId === u.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleUsers.length === 0 && (
              <p className={styles.empty}>No users match your search.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
