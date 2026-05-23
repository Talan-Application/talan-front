import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../../stores/quizStore';
import { PAGE_SIZES, ROUTES } from '../../../constants';
import { QuizCard } from '../../../components/quiz/QuizCard';
import '../../quiz.css';

export function StudentQuizListPage() {
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
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>← Home</button>
          <h1 className="qm-page-title">Available Quizzes</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <div className="qm-toolbar-left">
            <label className="qm-per-page-label">Per page</label>
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
            <span>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="qm-empty-state">
            <p>No quizzes available yet.</p>
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
              ← Prev
            </button>
            <span className="qm-page-label">Page {page}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
