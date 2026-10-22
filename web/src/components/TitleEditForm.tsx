import { useEffect, useState } from 'react';
import { updateTitle } from '../api';
import type { Title } from '../types';
import { getErrorMessage } from '../utils/error';

interface TitleEditFormProps {
  title: Title;
  onTitleEdit: () => void;
  onCancel: () => void;
}

export default function TitleEditForm({
  title,
  onTitleEdit,
  onCancel,
}: TitleEditFormProps) {
  const [titleForm, setTitleForm] = useState({
    name: '',
    type: 'movie',
    releaseYear: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState<File | undefined>();
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  useEffect(() => {
    if (!title) return;
    setTitleForm({
      name: title.name || '',
      type: title.type || 'movie',
      releaseYear: title.releaseYear ? String(title.releaseYear) : '',
      description: title.description || '',
    });
  }, [title]);

  const previewSrc = newImagePreview
    ? newImagePreview
    : title.imageUrl && !removeImage
      ? title.imageUrl
      : null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setNewImage(undefined);
      setNewImagePreview(null);
      return;
    }

    setNewImage(file);
    setRemoveImage(false);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setRemoveImage(true);
    setNewImage(undefined);
    setNewImagePreview(null);
  };

  const handleSaveTitle = async () => {
    if (!title) return;
    setSaving(true);
    try {
      await updateTitle(title.id, {
        name: titleForm.name,
        type: titleForm.type,
        releaseYear: titleForm.releaseYear
          ? Number(titleForm.releaseYear)
          : undefined,
        description: titleForm.description,
        image: newImage,
        removeImage,
      });
      onTitleEdit();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div>
        <h3>Edit title</h3>
        <div className="form-stack">
          <div>
            <label>
              Image
              <br />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="Poster preview"
                  style={{
                    width: 200,
                    height: 300,
                    objectFit: 'cover',
                    display: 'block',
                    marginTop: 8,
                  }}
                />
              )}
              {previewSrc && (
                <button type="button" onClick={handleRemoveImage}>
                  Remove image
                </button>
              )}
            </label>
          </div>

          <div>
            <label>
              Name
              <br />
              <input
                value={titleForm.name}
                onChange={(e) =>
                  setTitleForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="full-width"
              />
            </label>
          </div>

          <div>
            <label>
              Category
              <br />
              <select
                value={titleForm.type}
                onChange={(e) =>
                  setTitleForm((prev) => ({ ...prev, type: e.target.value }))
                }
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
                value={titleForm.releaseYear}
                onChange={(e) =>
                  setTitleForm((prev) => ({
                    ...prev,
                    releaseYear: e.target.value,
                  }))
                }
                className="full-width"
              />
            </label>
          </div>

          <div>
            <label>
              Description
              <br />
              <textarea
                rows={3}
                value={titleForm.description}
                onChange={(e) =>
                  setTitleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="full-width"
              />
            </label>
          </div>

          <div className="inline-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" onClick={handleSaveTitle} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
