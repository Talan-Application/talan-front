import { useNavigate } from 'react-router-dom';
import type { Quiz } from '../../types/quiz.types';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/format';

const STATUS_CLASS: Record<string, string> = {
  active: 'qm-status-active',
  published: 'qm-status-active',
  draft: 'qm-status-draft',
  inactive: 'qm-status-inactive',
  archived: 'qm-status-inactive',
};

function statusClass(status: string): string {
  return STATUS_CLASS[status.toLowerCase()] ?? 'qm-status-draft';
}

interface Props {
  item: Quiz;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuizCard({ item, onEdit, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div className="quiz-card">
      <div className="quiz-card-top">
        <span className={`qm-status ${statusClass(item.status)}`}>{item.status}</span>
        <span className="quiz-card-id">#{item.id}</span>
      </div>
      <h3 className="quiz-card-title">{item.title}</h3>
      <dl className="quiz-card-meta">
        <div className="quiz-card-row">
          <dt>Language</dt>
          <dd>{item.language || '—'}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>Subject ID</dt>
          <dd>{item.subject_id}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>Created</dt>
          <dd>{item.created_at ? formatDate(item.created_at) : '—'}</dd>
        </div>
      </dl>
      <div className="quiz-card-actions">
        <button className="qm-btn qm-btn-sm qm-btn-primary" onClick={() => navigate(ROUTES.TAKE_QUIZ(item.id))}>
          Take
        </button>
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZ_RESULTS(item.id))}>
          Results
        </button>
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={onEdit}>
          Edit
        </button>
        <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
