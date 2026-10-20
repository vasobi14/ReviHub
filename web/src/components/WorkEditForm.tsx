import { useEffect, useState } from 'react';
import { updateWork } from '../api';
import type { Work } from '../types';
import { getErrorMessage } from '../utils/error';

interface WorkEditFormProps {
  work: Work;
  onWorkEdit: () => void;
  onCancel: () => void;
}

export default function WorkEditForm({
  work,
  onWorkEdit,
  onCancel,
}: WorkEditFormProps) {
  const [workForm, setWorkForm] = useState({
    title: '',
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
    if (!work) return;
    setWorkForm({
      title: work.title || '',
      type: work.type || 'movie',
      releaseYear: work.releaseYear ? String(work.releaseYear) : '',
      description: work.description || '',
    });
  }, [work]);

  const previewSrc = newImagePreview
    ? newImagePreview
    : work.imageUrl && !removeImage
      ? work.imageUrl
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

  const handleSaveWork = async () => {
    if (!work) return;
    setSaving(true);
    try {
      await updateWork(work.id, {
        title: workForm.title,
        type: workForm.type,
        releaseYear: workForm.releaseYear
          ? Number(workForm.releaseYear)
          : undefined,
        description: workForm.description,
        image: newImage,
        removeImage,
      });
      onWorkEdit();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div>
        <h3>Edit work</h3>
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
                value={workForm.title}
                onChange={(e) =>
                  setWorkForm((prev) => ({ ...prev, title: e.target.value }))
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
                value={workForm.type}
                onChange={(e) =>
                  setWorkForm((prev) => ({ ...prev, type: e.target.value }))
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
                value={workForm.releaseYear}
                onChange={(e) =>
                  setWorkForm((prev) => ({
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
                value={workForm.description}
                onChange={(e) =>
                  setWorkForm((prev) => ({
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
            <button type="button" onClick={handleSaveWork} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
