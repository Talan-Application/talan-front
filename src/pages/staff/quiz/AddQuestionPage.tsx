import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { questionApi, answerApi } from '../../../api';
import { AnswerField } from '../../../components/quiz/AnswerField';
import { ROUTES } from '../../../constants';
import '../../quiz.css';

interface AnswerDraft {
  text: string;
  is_correct: boolean;
}

const BLANK_FORM = {
  text: '',
  context: '',
  video_answer_url: '',
  order: '',
  answers: [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ] as AnswerDraft[],
};

export function AddQuestionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateAnswer(index: number, field: keyof AnswerDraft, value: string | boolean) {
    setForm(f => {
      const answers = [...f.answers];
      answers[index] = { ...answers[index], [field]: value };
      return { ...f, answers };
    });
  }

  async function handleSave() {
    if (!form.text.trim()) return;
    setSaving(true);
    setError('');
    try {
      const question = await questionApi.create({
        quiz_id: quizId,
        text: form.text,
        ...(form.context.trim() ? { context: form.context.trim() } : {}),
        ...(form.video_answer_url.trim() ? { video_answer_url: form.video_answer_url.trim() } : {}),
        ...(form.order !== '' ? { order: Number(form.order) } : {}),
      });
      await Promise.all(
        form.answers
          .filter(a => a.text.trim())
          .map(a => answerApi.create({ question_id: question.id, text: a.text.trim(), is_correct: a.is_correct }))
      );
      navigate(ROUTES.QUIZ_EDIT(quizId));
    } catch {
      setError(t('quiz.questions.addFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.QUIZ_EDIT(quizId))}>
            {t('common.back')}
          </button>
          <h1 className="qm-page-title">{t('quiz.questions.addNewQuestion')}</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-create-card">
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label">{t('quiz.questions.questionText')}</label>
              <textarea
                className="qm-input qm-textarea"
                rows={3}
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder={t('quiz.questions.questionPlaceholder')}
                autoFocus
              />
            </div>
            <div className="qm-field-row">
              <div className="qm-field">
                <label className="qm-label">{t('quiz.questions.context')}</label>
                <input
                  className="qm-input"
                  value={form.context}
                  onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
                  placeholder={t('quiz.questions.contextPlaceholder')}
                />
              </div>
              <div className="qm-field qm-field-narrow">
                <label className="qm-label">{t('quiz.questions.order')}</label>
                <input
                  className="qm-input"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="qm-field">
              <label className="qm-label">{t('quiz.questions.answerOptions')}</label>
              <div className="qm-answers-list">
                {form.answers.map((ans, i) => (
                  <AnswerField
                    key={i}
                    text={ans.text}
                    isCorrect={ans.is_correct}
                    index={i}
                    canRemove={form.answers.length > 1}
                    onTextChange={text => updateAnswer(i, 'text', text)}
                    onCorrectChange={correct => updateAnswer(i, 'is_correct', correct)}
                    onRemove={() => setForm(f => ({ ...f, answers: f.answers.filter((_, j) => j !== i) }))}
                  />
                ))}
                <button
                  type="button"
                  className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                  onClick={() => setForm(f => ({ ...f, answers: [...f.answers, { text: '', is_correct: false }] }))}
                >
                  {t('quiz.questions.addAnswerOption')}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="qm-error qm-error-inline">{error}</p>}

          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZ_EDIT(quizId))}>
              {t('common.cancel')}
            </button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={() => void handleSave()}
              disabled={saving || !form.text.trim()}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
