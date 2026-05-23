import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi } from '../../../api/quiz';
import type { QuizResultSummary } from '../../../types/quiz.types';
import { getApiErrorMessage } from '../../../utils/error';
import { formatDateTime } from '../../../utils/format';
import { PASS_THRESHOLD, ROUTES } from '../../../constants';
import './take-quiz.css';

export function QuizResultsPage() {
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
        <button className="qm-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="tq-quiz-title">Quiz Results</h1>
        <button
          className="qm-btn qm-btn-primary qm-btn-sm"
          onClick={() => navigate(ROUTES.TAKE_QUIZ(quizId))}
        >
          Take Quiz
        </button>
      </div>

      <div className="tq-content">
        {loading && (
          <div className="tq-loading"><span className="qm-spinner" /> Loading results…</div>
        )}
        {error && <p className="qm-error">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <div className="qm-empty-state">
            <p>No attempts yet.</p>
            <button
              className="qm-btn qm-btn-primary"
              onClick={() => navigate(ROUTES.TAKE_QUIZ(quizId))}
            >
              Take Quiz Now
            </button>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="qm-section">
            <div className="qm-section-head">
              <span className="qm-count">
                {results.length} attempt{results.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="qm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Total</th>
                  <th>Submitted</th>
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
