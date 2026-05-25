import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizApi } from '../../../api/quiz';
import type { QuizResultSummary } from '../../../types/quiz.types';
import { getApiErrorMessage } from '../../../utils/error';
import { formatDateTime } from '../../../utils/format';
import { PASS_THRESHOLD, ROUTES } from '../../../constants';
import './take-quiz.css';

export function QuizResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);

  const [results, setResults] = useState<QuizResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    quizApi
      .getResults(quizId)
      .then(data => setResults(data.results ?? []))
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [quizId]);

  return (
    <div className="tq-page">
      <div className="tq-header">
        <button className="qm-back-btn" onClick={() => navigate(-1)}>{t('common.back')}</button>
        <h1 className="tq-quiz-title">{t('quiz.results.title')}</h1>
        <button
          className="qm-btn qm-btn-primary qm-btn-sm"
          onClick={() => navigate(ROUTES.TAKE_QUIZ(quizId))}
        >
          {t('quiz.results.takeQuiz')}
        </button>
      </div>

      <div className="tq-content">
        {loading && (
          <div className="tq-loading"><span className="qm-spinner" /> {t('quiz.results.loading')}</div>
        )}
        {error && <p className="qm-error">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <div className="qm-empty-state">
            <p>{t('quiz.results.noAttempts')}</p>
            <button
              className="qm-btn qm-btn-primary"
              onClick={() => navigate(ROUTES.TAKE_QUIZ(quizId))}
            >
              {t('quiz.results.takeQuizNow')}
            </button>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="qm-section">
            <div className="qm-section-head">
              <span className="qm-count">
                {t('quiz.results.attempts', { count: results.length })}
              </span>
            </div>
            <table className="qm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('quiz.results.score')}</th>
                  <th>{t('quiz.results.correct')}</th>
                  <th>{t('quiz.results.total')}</th>
                  <th>{t('quiz.results.submitted')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const pct = Math.round(r.score);
                  const passed = pct >= PASS_THRESHOLD;
                  return (
                    <tr key={r.id}>
                      <td className="qm-td-id">{idx + 1}</td>
                      <td>
                        <span className={`qm-pill ${passed ? 'qm-pill-green' : 'tq-pill-fail'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td>{r.correct_answers}</td>
                      <td>{r.total_questions}</td>
                      <td className="qm-td-desc">{formatDateTime(r.submitted_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
