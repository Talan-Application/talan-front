import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { quizApi } from '../../../api';
import { useQuizStore } from '../../../stores/quizStore';
import { QuizStatus, type Quiz } from '../../../types/quiz.types';
import { PAGE_SIZES, ROUTES } from '../../../constants';
import { formatDate } from '../../../utils/format';
import '../../quiz.css';

type SortKey = 'id' | 'title' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_CLASS: Record<QuizStatus, string> = {
  [QuizStatus.DRAFT]: 'qm-status-draft',
  [QuizStatus.PUBLISHED]: 'qm-status-active',
};

export function QuizManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, error, limit, offset, hasMore, setLimit, setOffset, fetchQuizzes } = useQuizStore();
  const [deleteError, setDeleteError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'id': cmp = a.id - b.id; break;
      case 'title': cmp = a.title.localeCompare(b.title); break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'created_at': cmp = (a.created_at ?? 0) - (b.created_at ?? 0); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchQuizzes(controller.signal);
    return () => controller.abort();
  }, [limit, offset, fetchQuizzes]);

  function toggleExpand(id: number) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  async function handlePublish(id: number) {
    try {
      await quizApi.publish(id);
      await fetchQuizzes();
    } catch {
      setDeleteError(t('quiz.management.publishFailed'));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t('quiz.management.deleteConfirm'))) return;
    setDeleteError('');
    try {
      await quizApi.delete(id);
      setExpandedId(null);
      await fetchQuizzes();
    } catch {
      setDeleteError(t('quiz.management.deleteFailed'));
    }
  }

  const page = Math.floor(offset / limit) + 1;

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>{t('common.home')}</button>
          <h1 className="qm-page-title">{t('quiz.management.title')}</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <div className="qm-toolbar-left">
            <label className="qm-per-page-label">{t('common.perPage')}</label>
            <select
              className="qm-per-page"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="qm-btn qm-btn-primary" onClick={() => navigate(ROUTES.QUIZ_CREATE)}>{t('quiz.management.newQuiz')}</button>
        </div>

        {(error || deleteError) && <p className="qm-error">{error || deleteError}</p>}

        {loading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" />
            <span>{t('common.loading')}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="qm-empty-state">
            <p>{t('quiz.management.noQuizzes')}</p>
            <button className="qm-btn qm-btn-primary" onClick={() => navigate(ROUTES.QUIZ_CREATE)}>{t('quiz.management.createFirst')}</button>
          </div>
        ) : (
          <div className="qm-section">
            <table className="qm-table">
              <thead>
                <tr>
                  {(['id', 'title', 'status', 'created_at'] as SortKey[]).map(key => (
                    <th
                      key={key}
                      className="qm-th-sortable"
                      onClick={() => handleSort(key)}
                    >
                      {key === 'id' ? t('common.id')
                        : key === 'title' ? t('quiz.table.title')
                        : key === 'status' ? t('quiz.table.status')
                        : t('quiz.table.date')}
                      <span className={`qm-sort-icon${sortKey === key ? ' qm-sort-icon-active' : ''}`}>
                        {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item: Quiz) => (
                  <Fragment key={item.id}>
                    <tr
                      className={`qm-tr-clickable${expandedId === item.id ? ' qm-tr-expanded' : ''}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td className="qm-td-id">#{item.id}</td>
                      <td className="qm-td-main">{item.title}</td>
                      <td>
                        <span className={`qm-status ${STATUS_CLASS[item.status] ?? 'qm-status-draft'}`}>
                          {t(`quiz.statuses.${item.status}`)}
                        </span>
                      </td>
                      <td>{item.created_at ? formatDate(item.created_at) : '—'}</td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="qm-tr-action-row" onClick={e => e.stopPropagation()}>
                        <td colSpan={4}>
                          <div className="qm-tr-action-inner">
                            {item.status === QuizStatus.DRAFT && (
                              <button
                                className="qm-btn qm-btn-sm qm-btn-primary"
                                onClick={() => void handlePublish(item.id)}
                              >
                                {t('quiz.card.publish')}
                              </button>
                            )}
                            <button
                              className="qm-btn qm-btn-sm qm-btn-ghost"
                              onClick={() => navigate(ROUTES.QUIZ_RESULTS(item.id))}
                            >
                              {t('quiz.card.results')}
                            </button>
                            <button
                              className="qm-btn qm-btn-sm qm-btn-ghost qm-btn-icon"
                              onClick={() => navigate(ROUTES.QUIZ_EDIT(item.id))}
                              data-tooltip={t('quiz.card.edit')}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="qm-btn qm-btn-sm qm-btn-danger qm-btn-icon"
                              onClick={() => void handleDelete(item.id)}
                              data-tooltip={t('quiz.card.delete')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (offset > 0 || hasMore) && (
          <div className="qm-pagination">
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              {t('common.prev')}
            </button>
            <span className="qm-page-label">{t('common.page', { page })}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
