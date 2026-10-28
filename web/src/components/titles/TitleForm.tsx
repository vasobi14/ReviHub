import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Title, TitleType } from '../../api/types';
import { getErrorMessage } from '../../utils/error';
import { prepareCoverImage } from '../../utils/image';
import SegmentedControl from '../ui/SegmentedControl';
import styles from './TitleForm.module.css';
import { TITLE_TYPES } from './titleTypes';

const CATEGORY_OPTIONS = Object.entries(TITLE_TYPES).map(
  ([value, { label, icon }]) => ({ value: value as TitleType, label, icon }),
);

export interface TitleFormData {
  name: string;
  type: TitleType;
  releaseYear: number | null;
  description: string;
  image?: File;
  removeImage: boolean;
}

interface TitleFormProps {
  initial?: Title;
  submitLabel: string;
  onSubmit: (data: TitleFormData) => Promise<void>;
  onCancel: () => void;
}

// "Add title" and "Edit title"
export default function TitleForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: TitleFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<TitleType>(initial?.type ?? 'movie');
  const [releaseYear, setReleaseYear] = useState(
    initial?.releaseYear ? String(initial.releaseYear) : '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const coverSrc =
    imagePreview ??
    (initial?.imageUrl && !removeImage ? initial.imageUrl : null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    const file = await prepareCoverImage(original);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImage(undefined);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        name,
        type,
        releaseYear: releaseYear ? Number(releaseYear) : null,
        description,
        image,
        removeImage,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.layout}>
        <div className={styles.cover}>
          <label className={styles.dropzone}>
            {coverSrc ? (
              <img src={coverSrc} alt="Cover preview" />
            ) : (
              <span className={styles.empty}>
                <ImagePlus size={32} aria-hidden="true" />
                <span>Add cover</span>
                <span className="field-hint">JPG, PNG or WebP</span>
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Cover image"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
          </label>
          {coverSrc && (
            <button
              type="button"
              className="button-text"
              onClick={handleRemoveImage}
            >
              Remove cover
            </button>
          )}
        </div>

        <div className={styles.fields}>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={200}
            />
          </label>

          <div className={`field-row ${styles.categoryRow}`}>
            <SegmentedControl
              label="Category"
              options={CATEGORY_OPTIONS}
              value={type}
              onChange={setType}
            />
            <label className="field">
              <span className="field-label">Release year</span>
              <input
                type="number"
                min={1888}
                max={2100}
                placeholder="e.g. 2019"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              rows={5}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
