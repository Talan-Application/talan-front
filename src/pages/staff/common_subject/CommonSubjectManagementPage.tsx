import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { commonSubjectApi } from '../../../api';
import type { CommonSubject } from '../../../types/common_subject.types';
import { ROUTES } from '../../../constants';
import { formatDate } from '../../../utils/format';
import { Modal } from '../../../components/quiz/Modal';
import '../../quiz.css';

interface CommonSubjectForm {
  name_ru: string;
  name_kk: string;
}

const BLANK_FORM: CommonSubjectForm = { name_ru: '', name_kk: '' };

const PAGE_SIZE = 20;

export function CommonSubjectManagementPage() {
  const navigate = useNavigate();
  const [common_subjects, setCommonSubjects] = useState<CommonSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<CommonSubject | null>(null);
  const [form, setForm] = useState<CommonSubjectForm>(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const data = await commonSubjectApi.getAll({ limit: PAGE_SIZE, offset }, signal);
      setCommonSubjects(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      setError('Failed to load common subjects.');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function openCreate() {
    setForm(BLANK_FORM);
    setFormError('');
    setModal('create');
  }

  function openEdit(common_subject: CommonSubject) {
    setForm({ name_ru: common_subject.translations.ru, name_kk: common_subject.translations.kk });
    setFormError('');
    setEditTarget(common_subject);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
  }

  async function handleCreate() {
    if (!form.name_ru.trim() || !form.name_kk.trim()) {
      setFormError('Both fields are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await commonSubjectApi.create({ translations: { ru: form.name_ru, kk: form.name_kk } });
      closeModal();
      await load();
    } catch {
      setFormError('Failed to create common subject.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editTarget || !form.name_ru.trim() || !form.name_kk.trim()) {
      setFormError('Both fields are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await commonSubjectApi.update(editTarget.id, { translations: { ru: form.name_ru, kk: form.name_kk } });
      closeModal();
      await load();
    } catch {
      setFormError('Failed to update common subject.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(common_subject: CommonSubject) {
    if (!confirm(`Delete common subject "${common_subject.translations.ru}"?`)) return;
    setError('');
    try {
      await commonSubjectApi.delete(common_subject.id);
      await load();
    } catch {
      setError('Delete failed. Please try again.');
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>← Home</button>
          <h1 className="qm-page-title">Common Subject Management</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <span />
          <button className="qm-btn qm-btn-primary" onClick={openCreate}>+ Add Common Subject</button>
        </div>

        {error && <p className="qm-error">{error}</p>}

        <div className="qm-section">
          {loading ? (
            <div className="qm-loading-wrap">
              <span className="qm-spinner" />
              <span>Loading…</span>
            </div>
          ) : (
            <table className="qm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name (RU)</th>
                  <th>Name (KZ)</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {common_subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="qm-empty">
                      No common subjects found. Click "Add Common Subject" to create one.
                    </td>
                  </tr>
                ) : (
                  common_subjects.map(common_subject => (
                    <tr key={common_subject.id}>
                      <td className="qm-td-id">#{common_subject.id}</td>
                      <td className="qm-td-main">{common_subject.translations.ru || '—'}</td>
                      <td className="qm-td-main">{common_subject.translations.kk || '—'}</td>
                      <td className="qm-td-desc">{formatDate(common_subject.created_at)}</td>
                      <td>
                        <div className="qm-td-actions">
                          <button
                            className="qm-btn qm-btn-ghost qm-btn-sm"
                            onClick={() => openEdit(common_subject)}
                          >
                            Edit
                          </button>
                          <button
                            className="qm-btn qm-btn-danger qm-btn-sm"
                            onClick={() => handleDelete(common_subject)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (offset > 0 || hasMore) && (
          <div className="qm-pagination">
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              ← Prev
            </button>
            <span className="qm-page-label">Page {page}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add Common Subject' : 'Edit Common Subject'}
          onClose={closeModal}
        >
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label" htmlFor="sub-name-ru">Name (RU)</label>
              <input
                id="sub-name-ru"
                className="qm-input"
                placeholder="Common subject name in Russian"
                value={form.name_ru}
                onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))}
              />
            </div>
            <div className="qm-field">
              <label className="qm-label" htmlFor="sub-name-kk">Name (KK)</label>
              <input
                id="sub-name-kk"
                className="qm-input"
                placeholder="Common subject name in Kazakh"
                value={form.name_kk}
                onChange={e => setForm(f => ({ ...f, name_kk: e.target.value }))}
              />
            </div>
            {formError && <p className="qm-error" style={{ margin: 0 }}>{formError}</p>}
          </div>
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={modal === 'create' ? handleCreate : handleEdit}
              disabled={saving}
            >
              {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
