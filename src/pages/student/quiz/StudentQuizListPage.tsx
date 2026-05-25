import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../../../stores/quizStore';
import { PAGE_SIZES, ROUTES } from '../../../constants';
import { QuizCard } from '../../../components/quiz/QuizCard';
import '../../quiz.css';

export function StudentQuizListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, error, limit, offset, hasMore, setLimit, setOffset, fetchQuizzes } = useQuizStore();

  useEffect(() => {
    const controller = new AbortController();
    void fetchQuizzes(controller.signal);
    return () => controller.abort();
  }, [limit, offset, fetchQuizzes]);

  const page = Math.floor(offset / limit) + 1;

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>{t('common.home')}</button>
          <h1 className="qm-page-title">{t('quiz.available.title')}</h1>
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
        </div>

        {error && <p className="qm-error">{error}</p>}

        {loading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" />
            <span>{t('common.loading')}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="qm-empty-state">
            <p>{t('quiz.available.noQuizzes')}</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {items.map(item => (
              <QuizCard key={item.id} item={item} />
            ))}
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
