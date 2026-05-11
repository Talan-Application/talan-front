import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../api/quiz';
import { questionApi } from '../api/question';
import { answerApi } from '../api/answer';
import type { Quiz, Question, Answer } from '../types/quiz.types';
import './quiz.css';

type Tab = 'quizzes' | 'questions' | 'answers';

const PAGE_SIZES = [6, 12, 24];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  // handles both seconds and milliseconds Unix timestamps
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const STATUS_CLASS: Record<string, string> = {
  active: 'qm-status-active',
  published: 'qm-status-active',
  draft: 'qm-status-draft',
  inactive: 'qm-status-inactive',
  archived: 'qm-status-inactive',
};

function statusClass(s: string) {
  return STATUS_CLASS[s.toLowerCase()] ?? 'qm-status-draft';
}

// ── Shared Modal ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-box" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <h3 className="qm-title">{title}</h3>
          <button className="qm-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Quiz Card ─────────────────────────────────────────────────────────────────

function QuizCard({ item, onEdit, onDelete }: {
  item: Quiz;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={onEdit}>Edit</button>
        <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ── Quizzes Tab ───────────────────────────────────────────────────────────────

const BLANK_QUIZ_FORM = { title: '', language: '', status: 'draft', type: '', subject_id: '' };

function QuizzesTab() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: Quiz } | null>(null);
  const [form, setForm] = useState(BLANK_QUIZ_FORM);
  const [saving, setSaving] = useState(false);

  async function load(lim = limit, off = offset, signal?: AbortSignal) {
    setLoading(true);
    setError('');
    try {
      const data = await quizApi.getAll({ limit: lim, offset: off }, signal);
      setItems(data);
      setHasMore(data.length === lim);
    } catch (err) {
      if (!axios.isCancel(err)) setError('Failed to load quizzes.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(limit, offset, controller.signal);
    return () => controller.abort();
  }, [limit, offset]);

  function changePage(newOffset: number) {
    setOffset(newOffset);
  }

  function changeLimit(newLimit: number) {
    setLimit(newLimit);
    setOffset(0);
  }

  function openCreate() {
    setForm(BLANK_QUIZ_FORM);
    setModal({ mode: 'create' });
  }

  function openEdit(item: Quiz) {
    setForm({
      title: item.title,
      language: item.language,
      status: item.status,
      type: item.type,
      subject_id: String(item.subject_id),
    });
    setModal({ mode: 'edit', item });
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      language: form.language,
      status: form.status,
      type: form.type,
      subject_id: Number(form.subject_id),
    };
    try {
      if (modal?.mode === 'create') {
        await quizApi.create(payload);
      } else if (modal?.item) {
        await quizApi.update(modal.item.id, payload);
      }
      setModal(null);
      await load(limit, offset);
    } catch { setError('Save failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this quiz?')) return;
    setError('');
    try { await quizApi.delete(id); await load(limit, offset); }
    catch { setError('Delete failed.'); }
  }

  const page = Math.floor(offset / limit) + 1;

  return (
    <section>
      {/* toolbar */}
      <div className="qm-toolbar">
        <div className="qm-toolbar-left">
          <label className="qm-per-page-label">Per page</label>
          <select
            className="qm-per-page"
            value={limit}
            onChange={e => changeLimit(Number(e.target.value))}
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="qm-btn qm-btn-primary" onClick={openCreate}>+ New Quiz</button>
      </div>

      {error && <p className="qm-error">{error}</p>}

      {loading ? (
        <div className="qm-loading-wrap">
          <span className="qm-spinner" />
          <span>Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="qm-empty-state">
          <p>No quizzes found.</p>
          <button className="qm-btn qm-btn-primary" onClick={openCreate}>Create your first quiz</button>
        </div>
      ) : (
        <div className="quiz-grid">
          {items.map(item => (
            <QuizCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            />
          ))}
        </div>
      )}

      {/* pagination */}
      {!loading && (offset > 0 || hasMore) && (
        <div className="qm-pagination">
          <button
            className="qm-btn qm-btn-ghost qm-btn-sm"
            disabled={offset === 0}
            onClick={() => changePage(Math.max(0, offset - limit))}
          >
            ← Prev
          </button>
          <span className="qm-page-label">Page {page}</span>
          <button
            className="qm-btn qm-btn-ghost qm-btn-sm"
            disabled={!hasMore}
            onClick={() => changePage(offset + limit)}
          >
            Next →
          </button>
        </div>
      )}

      {/* create / edit modal */}
      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'New Quiz' : 'Edit Quiz'}
          onClose={() => setModal(null)}
        >
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label">Title *</label>
              <input
                className="qm-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Quiz title"
                autoFocus
              />
            </div>
            <div className="qm-field-row">
              <div className="qm-field">
                <label className="qm-label">Language</label>
                <input
                  className="qm-input"
                  value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  placeholder="e.g. English"
                />
              </div>
              <div className="qm-field">
                <label className="qm-label">Status</label>
                <select
                  className="qm-input qm-select"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="qm-field-row">
              <div className="qm-field">
                <label className="qm-label">Type</label>
                <input
                  className="qm-input"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. multiple_choice"
                />
              </div>
              <div className="qm-field">
                <label className="qm-label">Subject ID</label>
                <input
                  className="qm-input"
                  type="number"
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={save}
              disabled={saving || !form.title.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Questions Tab ─────────────────────────────────────────────────────────────

function QuestionsTab() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: Question } | null>(null);
  const [form, setForm] = useState({ quiz_id: 0, text: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [q, qs] = await Promise.all([
        quizApi.getAll({ limit: 100, offset: 0 }),
        questionApi.getAll(),
      ]);
      setQuizzes(q);
      setItems(qs);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ quiz_id: quizzes[0]?.id ?? 0, text: '' });
    setModal({ mode: 'create' });
  }

  function openEdit(item: Question) {
    setForm({ quiz_id: item.quiz_id, text: item.text });
    setModal({ mode: 'edit', item });
  }

  async function save() {
    if (!form.text.trim() || !form.quiz_id) return;
    setSaving(true);
    setError('');
    try {
      if (modal?.mode === 'create') {
        await questionApi.create({ quiz_id: form.quiz_id, text: form.text });
      } else if (modal?.item) {
        await questionApi.update(modal.item.id, { quiz_id: form.quiz_id, text: form.text });
      }
      setModal(null);
      await load();
    } catch { setError('Save failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this question and all its answers?')) return;
    setError('');
    try { await questionApi.delete(id); await load(); }
    catch { setError('Delete failed.'); }
  }

  const quizLabel = (id: number) => quizzes.find(q => q.id === id)?.title ?? `Quiz #${id}`;

  return (
    <section className="qm-section">
      <div className="qm-section-head">
        <span className="qm-count">{items.length} question{items.length !== 1 ? 's' : ''}</span>
        <button
          className="qm-btn qm-btn-primary"
          onClick={openCreate}
          disabled={quizzes.length === 0}
          title={quizzes.length === 0 ? 'Create a quiz first' : ''}
        >
          + New Question
        </button>
      </div>

      {quizzes.length === 0 && !loading && (
        <p className="qm-info">Create a quiz first before adding questions.</p>
      )}
      {error && <p className="qm-error">{error}</p>}

      {loading ? (
        <p className="qm-loading">Loading…</p>
      ) : (
        <table className="qm-table">
          <thead>
            <tr><th>ID</th><th>Quiz</th><th>Question</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="qm-empty">No questions yet.</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td className="qm-td-id">{item.id}</td>
                <td className="qm-td-badge"><span className="qm-badge">{quizLabel(item.quiz_id)}</span></td>
                <td className="qm-td-main">{item.text}</td>
                <td className="qm-td-actions">
                  <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => openEdit(item)}>Edit</button>
                  <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={() => remove(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'New Question' : 'Edit Question'}
          onClose={() => setModal(null)}
        >
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label">Quiz *</label>
              <select
                className="qm-input qm-select"
                value={form.quiz_id}
                onChange={e => setForm(f => ({ ...f, quiz_id: Number(e.target.value) }))}
              >
                {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
              </select>
            </div>
            <div className="qm-field">
              <label className="qm-label">Question text *</label>
              <textarea
                className="qm-input qm-textarea"
                rows={3}
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Enter question text"
                autoFocus
              />
            </div>
          </div>
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={save}
              disabled={saving || !form.text.trim() || !form.quiz_id}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Answers Tab ───────────────────────────────────────────────────────────────

function AnswersTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [items, setItems] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: Answer } | null>(null);
  const [form, setForm] = useState({ question_id: 0, text: '', is_correct: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [qs, ans] = await Promise.all([questionApi.getAll(), answerApi.getAll()]);
      setQuestions(qs);
      setItems(ans);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ question_id: questions[0]?.id ?? 0, text: '', is_correct: false });
    setModal({ mode: 'create' });
  }

  function openEdit(item: Answer) {
    setForm({ question_id: item.question_id, text: item.text, is_correct: item.is_correct });
    setModal({ mode: 'edit', item });
  }

  async function save() {
    if (!form.text.trim() || !form.question_id) return;
    setSaving(true);
    setError('');
    try {
      if (modal?.mode === 'create') {
        await answerApi.create({ question_id: form.question_id, text: form.text, is_correct: form.is_correct });
      } else if (modal?.item) {
        await answerApi.update(modal.item.id, { question_id: form.question_id, text: form.text, is_correct: form.is_correct });
      }
      setModal(null);
      await load();
    } catch { setError('Save failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this answer?')) return;
    setError('');
    try { await answerApi.delete(id); await load(); }
    catch { setError('Delete failed.'); }
  }

  const questionLabel = (id: number) => {
    const q = questions.find(q => q.id === id);
    if (!q) return `Question #${id}`;
    return q.text.length > 50 ? q.text.slice(0, 50) + '…' : q.text;
  };

  return (
    <section className="qm-section">
      <div className="qm-section-head">
        <span className="qm-count">{items.length} answer{items.length !== 1 ? 's' : ''}</span>
        <button
          className="qm-btn qm-btn-primary"
          onClick={openCreate}
          disabled={questions.length === 0}
          title={questions.length === 0 ? 'Create questions first' : ''}
        >
          + New Answer
        </button>
      </div>

      {questions.length === 0 && !loading && (
        <p className="qm-info">Create questions first before adding answers.</p>
      )}
      {error && <p className="qm-error">{error}</p>}

      {loading ? (
        <p className="qm-loading">Loading…</p>
      ) : (
        <table className="qm-table">
          <thead>
            <tr><th>ID</th><th>Question</th><th>Answer</th><th>Correct</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="qm-empty">No answers yet.</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td className="qm-td-id">{item.id}</td>
                <td className="qm-td-badge"><span className="qm-badge">{questionLabel(item.question_id)}</span></td>
                <td className="qm-td-main">{item.text}</td>
                <td className="qm-td-correct">
                  <span className={`qm-pill ${item.is_correct ? 'qm-pill-green' : 'qm-pill-gray'}`}>
                    {item.is_correct ? 'Correct' : 'Wrong'}
                  </span>
                </td>
                <td className="qm-td-actions">
                  <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => openEdit(item)}>Edit</button>
                  <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={() => remove(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'New Answer' : 'Edit Answer'}
          onClose={() => setModal(null)}
        >
          <div className="qm-form">
            <div className="qm-field">
              <label className="qm-label">Question *</label>
              <select
                className="qm-input qm-select"
                value={form.question_id}
                onChange={e => setForm(f => ({ ...f, question_id: Number(e.target.value) }))}
              >
                {questions.map(q => <option key={q.id} value={q.id}>{q.text}</option>)}
              </select>
            </div>
            <div className="qm-field">
              <label className="qm-label">Answer text *</label>
              <input
                className="qm-input"
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Enter answer text"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && save()}
              />
            </div>
            <div className="qm-field qm-field-check">
              <input
                type="checkbox"
                id="is_correct"
                className="qm-checkbox"
                checked={form.is_correct}
                onChange={e => setForm(f => ({ ...f, is_correct: e.target.checked }))}
              />
              <label htmlFor="is_correct" className="qm-label-check">Mark as correct answer</label>
            </div>
          </div>
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={save}
              disabled={saving || !form.text.trim() || !form.question_id}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: Tab[] = ['quizzes', 'questions', 'answers'];

export function QuizPage() {
  const [tab, setTab] = useState<Tab>('quizzes');
  const navigate = useNavigate();

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate('/')}>← Home</button>
          <h1 className="qm-page-title">Quiz Management</h1>
        </div>
        <nav className="qm-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`qm-tab ${tab === t ? 'qm-tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="qm-content">
        {tab === 'quizzes' && <QuizzesTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'answers' && <AnswersTab />}
      </div>
    </div>
  );
}
