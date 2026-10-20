import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWork } from '../api';
import { Header } from '../components/Header';
import { getErrorMessage } from '../utils/error';

export default function CreateWorkPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('movie');
  const [releaseYear, setReleaseYear] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const work = await createWork({
        title,
        type,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        description,
        image,
      });
      navigate(`/works/${work.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <Header />
      <div className="create-work-page">
        <h1>Add work</h1>
        <form onSubmit={handleSubmit} className="form-stack form-wide">
          <div>
            <label>
              Image
              <br />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) {
                    setImage(undefined);
                    setImagePreview(null);
                    return;
                  }

                  setImage(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Poster preview"
                  style={{
                    width: 200,
                    height: 300,
                    borderRadius: 10,
                    objectFit: 'cover',
                  }}
                />
              )}
            </label>
            <label>
              <br />
              Name
              <br />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="full-width"
              />
            </label>
          </div>
          <div>
            <label>
              Category
              <br />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="full-width"
              >
                <option value="movie">movie</option>
                <option value="game">game</option>
                <option value="book">book</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Release year
              <br />
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="full-width"
              />
            </label>
          </div>
          <div>
            <label>
              Description
              <br />
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="full-width"
              />
            </label>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="inline-actions-wide">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
