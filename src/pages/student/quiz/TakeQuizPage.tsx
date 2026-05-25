import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizApi } from '../../../api/quiz';
import { questionApi } from '../../../api/question';
import { answerApi } from '../../../api/answer';
import type { TakeQuizResponse, SubmitQuizResponse, QuestionResult } from '../../../types/quiz.types';
import { getApiErrorMessage } from '../../../utils/error';
import { PASS_THRESHOLD, ROUTES } from '../../../constants';
import './take-quiz.css';

type Phase = 'loading' | 'taking' | 'submitting' | 'done' | 'error';

export function TakeQuizPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);

  const [phase, setPhase] = useState<Phase>('loading');
  const [quizData, setQuizData] = useState<TakeQuizResponse | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitResult, setSubmitResult] = useState<SubmitQuizResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [quiz, rawQuestions] = await Promise.all([
          quizApi.getById(quizId),
          questionApi.getByQuizId(quizId, { limit: 100, offset: 0 }),
        ]);
        const questions = await Promise.all(
          rawQuestions.map(async q => {
            const rawAnswers = await answerApi.getByQuestionId(q.id, { limit: 100, offset: 0 });
            return {
              id: q.id,
              text: q.text,
              context: q.context,
              video_answer_url: q.video_answer_url,
              order: q.order,
              answers: rawAnswers.map(a => ({ id: a.id, text: a.text })),
            };
          })
        );
        setQuizData({ quiz, questions } satisfies TakeQuizResponse);
        setPhase('taking');
      } catch (err) {
        setError(getApiErrorMessage(err));
        setPhase('error');
      }
    }
    void load();
  }, [quizId]);

  function selectAnswer(questionId: number, answerId: number) {
    setSelected(prev => ({ ...prev, [questionId]: answerId }));
  }

  const questions = quizData?.questions ?? [];
  const answeredCount = Object.keys(selected).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setPhase('submitting');
    try {
      const result = await quizApi.submitQuiz(quizId, {
        answers: questions.map(q => ({ question_id: q.id, answer_id: selected[q.id] })),
      });
      setSubmitResult(result);
      setPhase('done');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPhase('error');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="tq-page">
        <div className="tq-loading"><span className="qm-spinner" /> {t('quiz.take.loading')}</div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="tq-page">
        <div className="tq-loading tq-error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="qm-btn qm-btn-ghost" onClick={() => navigate(-1)}>{t('quiz.take.goBack')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'done' && submitResult) {
    return (
      <ResultView
        data={submitResult}
        questions={quizData!}
        onRetry={() => navigate(0)}
        onBack={() => navigate(-1)}
        onResults={() => navigate(ROUTES.QUIZ_RESULTS(quizId))}
      />
    );
  }

  return (
    <div className="tq-page">
      <div className="tq-header">
        <button className="qm-back-btn" onClick={() => navigate(-1)}>{t('common.back')}</button>
        <h1 className="tq-quiz-title">{quizData?.quiz.title}</h1>
        <span className="tq-progress">{t('quiz.take.answered', { answered: answeredCount, total: questions.length })}</span>
      </div>

      <div className="tq-content">
        {questions.map((q, idx) => {
          const chosen = selected[q.id];
          return (
            <div key={q.id} className="tq-question">
              <p className="tq-q-num">{t('quiz.take.question', { number: idx + 1 })}</p>
              <p className="tq-q-text">{q.text}</p>
              {q.context && <p className="tq-q-context">{q.context}</p>}
              <div className="tq-answers">
                {q.answers.map(ans => (
                  <label
                    key={ans.id}
                    className={`tq-answer${chosen === ans.id ? ' tq-answer-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={ans.id}
                      checked={chosen === ans.id}
                      onChange={() => selectAnswer(q.id, ans.id)}
                    />
                    <span>{ans.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="tq-footer">
          {!allAnswered && (
            <p className="tq-hint">{t('quiz.take.remaining', { count: questions.length - answeredCount })}</p>
          )}
          <button
            className="qm-btn qm-btn-primary tq-submit-btn"
            onClick={handleSubmit}
            disabled={!allAnswered || phase === 'submitting'}
          >
            {phase === 'submitting' ? t('quiz.take.submitting') : t('quiz.take.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResultViewProps {
  data: SubmitQuizResponse;
  questions: TakeQuizResponse;
  onRetry: () => void;
  onBack: () => void;
  onResults: () => void;
}

function ResultView({ data, questions, onRetry, onBack, onResults }: ResultViewProps) {
  const { t } = useTranslation();
  const pct = Math.round(data.score);
  const passed = pct >= PASS_THRESHOLD;

  const resultMap: Record<number, QuestionResult> = {};
  for (const r of data.results) resultMap[r.question_id] = r;

  return (
    <div className="tq-page">
      <div className="tq-result-card">
        <div className={`tq-score-circle ${passed ? 'tq-score-pass' : 'tq-score-fail'}`}>
          <span className="tq-score-pct">{pct}%</span>
          <span className="tq-score-label">{passed ? t('quiz.take.passed') : t('quiz.take.failed')}</span>
        </div>
        <div className="tq-score-stats">
          <div className="tq-stat">
            <span className="tq-stat-val">{data.correct_answers}</span>
            <span className="tq-stat-lbl">{t('quiz.take.correct')}</span>
          </div>
          <div className="tq-stat">
            <span className="tq-stat-val">{data.total_questions - data.correct_answers}</span>
            <span className="tq-stat-lbl">{t('quiz.take.wrong')}</span>
          </div>
          <div className="tq-stat">
            <span className="tq-stat-val">{data.total_questions}</span>
            <span className="tq-stat-lbl">{t('quiz.take.total')}</span>
          </div>
        </div>
        <div className="tq-result-actions">
          <button className="qm-btn qm-btn-primary" onClick={onResults}>{t('quiz.take.viewHistory')}</button>
          <button className="qm-btn qm-btn-ghost" onClick={onRetry}>{t('quiz.take.retake')}</button>
          <button className="qm-btn qm-btn-ghost" onClick={onBack}>{t('quiz.take.back')}</button>
        </div>
      </div>

      <div className="tq-content tq-breakdown">
        <h2 className="tq-breakdown-title">{t('quiz.take.breakdown')}</h2>
        {questions.questions.map((q, idx) => {
          const r = resultMap[q.id];
          const correct = r?.is_correct ?? false;
          const chosenAns = q.answers.find(a => a.id === r?.answer_id);
          const correctAns = q.answers.find(a => a.id === r?.correct_answer_id);
          return (
            <div key={q.id} className={`tq-breakdown-item ${correct ? 'tq-bd-correct' : 'tq-bd-wrong'}`}>
              <div className="tq-bd-header">
                <span className="tq-bd-num">{t('quiz.take.questionNum', { num: idx + 1 })}</span>
                <span className="tq-bd-icon">{correct ? '✓' : '✗'}</span>
              </div>
              <p className="tq-bd-text">{q.text}</p>
              {chosenAns && (
                <p className="tq-bd-answer">{t('quiz.take.yourAnswer')} <strong>{chosenAns.text}</strong></p>
              )}
              {!correct && correctAns && (
                <p className="tq-bd-correct-ans">{t('quiz.take.correctAnswer')} <strong>{correctAns.text}</strong></p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
