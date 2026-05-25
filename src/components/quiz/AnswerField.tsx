import { useTranslation } from 'react-i18next';

interface Props {
  text: string;
  isCorrect: boolean;
  index: number;
  canRemove: boolean;
  onTextChange: (text: string) => void;
  onCorrectChange: (correct: boolean) => void;
  onRemove: () => void;
}

export function AnswerField({ text, isCorrect, index, canRemove, onTextChange, onCorrectChange, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <div className="qm-answer-row">
      <input
        className="qm-input qm-answer-input"
        value={text}
        onChange={e => onTextChange(e.target.value)}
        placeholder={t('quiz.questions.answer', { index: index + 1 })}
      />
      <label className="qm-answer-correct">
        <input
          type="checkbox"
          className="qm-checkbox"
          checked={isCorrect}
          onChange={e => onCorrectChange(e.target.checked)}
        />
        {t('quiz.questions.correct')}
      </label>
      {canRemove && (
        <button type="button" className="qm-btn qm-btn-sm qm-btn-danger" onClick={onRemove}>
          ×
        </button>
      )}
    </div>
  );
}
