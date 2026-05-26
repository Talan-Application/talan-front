import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QuizStatus, type Quiz } from '../../types/quiz.types';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/format';

const STATUS_CLASS: Record<QuizStatus, string> = {
  [QuizStatus.DRAFT]: 'qm-status-draft',
  [QuizStatus.PUBLISHED]: 'qm-status-active',
};

function statusClass(status: QuizStatus): string {
  return STATUS_CLASS[status] ?? 'qm-status-draft';
}

interface Props {
  item: Quiz;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
}

export function QuizCard({ item, onEdit, onDelete, onPublish }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="quiz-card">
      <div className="quiz-card-top">
        <span className={`qm-status ${statusClass(item.status)}`}>{t(`quiz.statuses.${item.status}`)}</span>
        <span className="quiz-card-id">#{item.id}</span>
      </div>
      <h3 className="quiz-card-title">{item.title}</h3>
      <dl className="quiz-card-meta">
        <div className="quiz-card-row">
          <dt>{t('quiz.card.type')}</dt>
          <dd>{t(`quiz.types.${item.type}`)}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>{t('quiz.card.language')}</dt>
          <dd>{item.language || '—'}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>{t('quiz.card.commonSubjectId')}</dt>
          <dd>{item.common_subject_id}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>{t('quiz.card.created')}</dt>
          <dd>{item.created_at ? formatDate(item.created_at) : '—'}</dd>
        </div>
      </dl>
      <div className="quiz-card-actions">
        <button className="qm-btn qm-btn-sm qm-btn-primary" onClick={() => navigate(ROUTES.TAKE_QUIZ(item.id))}>
          {t('quiz.card.take')}
        </button>
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZ_RESULTS(item.id))}>
          {t('quiz.card.results')}
        </button>
        {onPublish && item.status === QuizStatus.DRAFT && (
          <button className="qm-btn qm-btn-sm qm-btn-primary" onClick={onPublish}>
            {t('quiz.card.publish')}
          </button>
        )}
        {onEdit && (
          <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={onEdit}>
            {t('quiz.card.edit')}
          </button>
        )}
        {onDelete && (
          <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={onDelete}>
            {t('quiz.card.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
