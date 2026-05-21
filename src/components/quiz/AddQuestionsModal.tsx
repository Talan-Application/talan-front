import { useState } from 'react';
import { questionApi, answerApi } from '../../api';
import type { Quiz, Question } from '../../types/quiz.types';
import { Modal } from './Modal';
import { AnswerField } from './AnswerField';

interface AnswerDraft {
  text: string;
  is_correct: boolean;
}

interface QuestionDraft {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerDraft[];
}

const BLANK_DRAFT: QuestionDraft = {
  text: '',
  context: '',
  video_answer_url: '',
  order: '',
  answers: [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ],
};

interface Props {
  quiz: Quiz;
  onClose: () => void;
}

export function AddQuestionsModal({ quiz, onClose }: Props) {
  const [saved, setSaved] = useState<Question[]>([]);
  const [draft, setDraft] = useState<QuestionDraft>(BLANK_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateAnswer(index: number, field: keyof AnswerDraft, value: string | boolean) {
    setDraft(d => {
      const answers = [...d.answers];
      answers[index] = { ...answers[index], [field]: value };
      return { ...d, answers };
    });
  }

  function addAnswerOption() {
    setDraft(d => ({ ...d, answers: [...d.answers, { text: '', is_correct: false }] }));
  }

  function removeAnswerOption(index: number) {
    setDraft(d => ({ ...d, answers: d.answers.filter((_, i) => i !== index) }));
  }

  async function addQuestion() {
    if (!draft.text.trim()) return;
    setSaving(true);
    setError('');
    try {
      const question = await questionApi.create({
        quiz_id: quiz.id,
        text: draft.text,
        ...(draft.context.trim() ? { context: draft.context.trim() } : {}),
        ...(draft.video_answer_url.trim() ? { video_answer_url: draft.video_answer_url.trim() } : {}),
        ...(draft.order !== '' ? { order: Number(draft.order) } : {}),
      });
      await Promise.all(
        draft.answers
          .filter(a => a.text.trim())
          .map(a => answerApi.create({ question_id: question.id, text: a.text.trim(), is_correct: a.is_correct }))
      );
      setSaved(prev => [...prev, question]);
      setDraft(BLANK_DRAFT);
    } catch {
      setError('Failed to add question. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Add Questions — ${quiz.title}`} onClose={onClose} wide>
      <div className="qm-step2-body">
        {saved.length > 0 && (
          <div className="qm-added-questions">
            <p className="qm-added-label">
              {saved.length} question{saved.length !== 1 ? 's' : ''} added
            </p>
            {saved.map((q, i) => (
              <div key={q.id} className="qm-added-question-item">
                <span className="qm-added-q-num">{i + 1}.</span>
                <span className="qm-added-q-text">{q.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="qm-form">
          <div className="qm-field">
            <label className="qm-label">Question text *</label>
            <textarea
              className="qm-input qm-textarea"
              rows={2}
              value={draft.text}
              onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
              placeholder="Enter question text"
              autoFocus
            />
          </div>

          <div className="qm-field-row">
            <div className="qm-field">
              <label className="qm-label">Context</label>
              <input
                className="qm-input"
                value={draft.context}
                onChange={e => setDraft(d => ({ ...d, context: e.target.value }))}
                placeholder="Optional context"
              />
            </div>
            <div className="qm-field qm-field-narrow">
              <label className="qm-label">Order</label>
              <input
                className="qm-input"
                type="number"
                min={0}
                value={draft.order}
                onChange={e => setDraft(d => ({ ...d, order: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="qm-field">
            <label className="qm-label">Answer options</label>
            <div className="qm-answers-list">
              {draft.answers.map((ans, i) => (
                <AnswerField
                  key={i}
                  text={ans.text}
                  isCorrect={ans.is_correct}
                  index={i}
                  canRemove={draft.answers.length > 1}
                  onTextChange={text => updateAnswer(i, 'text', text)}
                  onCorrectChange={correct => updateAnswer(i, 'is_correct', correct)}
                  onRemove={() => removeAnswerOption(i)}
                />
              ))}
              <button
                type="button"
                className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                onClick={addAnswerOption}
              >
                + Add answer option
              </button>
            </div>
          </div>
        </div>

        {error && <p className="qm-error qm-error-inline">{error}</p>}
      </div>

      <div className="qm-modal-footer">
        <button
          className="qm-btn qm-btn-primary"
          onClick={addQuestion}
          disabled={saving || !draft.text.trim()}
        >
          {saving ? 'Adding…' : '+ Add Question'}
        </button>
        <button className="qm-btn qm-btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
