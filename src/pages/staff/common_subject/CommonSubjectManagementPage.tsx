import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
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
  const { t } = useTranslation();
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
      setError(t('commonSubject.management.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [offset, t]);

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
      setFormError(t('commonSubject.management.bothRequired'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await commonSubjectApi.create({ translations: { ru: form.name_ru, kk: form.name_kk } });
      closeModal();
      await load();
    } catch {
      setFormError(t('commonSubject.management.createFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editTarget || !form.name_ru.trim() || !form.name_kk.trim()) {
      setFormError(t('commonSubject.management.bothRequired'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await commonSubjectApi.update(editTarget.id, { translations: { ru: form.name_ru, kk: form.name_kk } });
      closeModal();
      await load();
    } catch {
      setFormError(t('commonSubject.management.updateFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(common_subject: CommonSubject) {
    if (!confirm(t('commonSubject.management.deleteConfirm', { name: common_subject.translations.ru }))) return;
    setError('');
    try {
      await commonSubjectApi.delete(common_subject.id);
      await load();
    } catch {
      setError(t('commonSubject.management.deleteFailed'));
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>{t('common.home')}</button>
          <h1 className="qm-page-title">{t('commonSubject.management.title')}</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <span />
          <button className="qm-btn qm-btn-primary" onClick={openCreate}>{t('commonSubject.management.addButton')}</button>
        </div>

        {error && <p className="qm-error">{error}</p>}

        <div className="qm-section">
          {loading ? (
            <div className="qm-loading-wrap">
              <span className="qm-spinner" />
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <table className="qm-table">
              <thead>
                <tr>
                  <th>{t('common.id')}</th>
                  <th>{t('commonSubject.management.nameRu')}</th>
                  <th>{t('commonSubject.management.nameKk')}</th>
                  <th>{t('commonSubject.management.createdDate')}</th>
                  <th>{t('commonSubject.management.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {common_subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="qm-empty">
                      {t('commonSubject.management.noSubjects')}
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
                            className="qm-btn qm-btn-ghost qm-btn-sm qm-btn-icon"
                            onClick={() => openEdit(common_subject)}
                            data-tooltip={t('common.edit')}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="qm-btn qm-btn-danger qm-btn-sm qm-btn-icon"
                            onClick={() => handleDelete(common_subject)}
                            data-tooltip={t('common.delete')}
                          >
                            <Trash2 size={15} />
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
              {t('common.prev')}
            </button>
            <span className="qm-page-label">{t('common.page', { page })}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? t('commonSubject.management.addTitle') : t('commonSubject.management.editTitle')}
          onClose={closeModal}
        >
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label" htmlFor="sub-name-ru">{t('commonSubject.management.nameRu')}</label>
              <input
                id="sub-name-ru"
                className="qm-input"
                placeholder={t('commonSubject.management.nameRuPlaceholder')}
                value={form.name_ru}
                onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))}
              />
            </div>
            <div className="qm-field">
              <label className="qm-label" htmlFor="sub-name-kk">{t('commonSubject.management.nameKk')}</label>
              <input
                id="sub-name-kk"
                className="qm-input"
                placeholder={t('commonSubject.management.nameKkPlaceholder')}
                value={form.name_kk}
                onChange={e => setForm(f => ({ ...f, name_kk: e.target.value }))}
              />
            </div>
            {formError && <p className="qm-error" style={{ margin: 0 }}>{formError}</p>}
          </div>
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={closeModal} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={modal === 'create' ? handleCreate : handleEdit}
              disabled={saving}
            >
              {saving ? t('common.saving') : modal === 'create' ? t('common.create') : t('common.save')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
