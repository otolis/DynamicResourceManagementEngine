import { useState, useRef } from 'react';
import { MessageSquare, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { useComments, type Comment } from '../../context/CommentsContext';
import { CyberButton } from '../ui/cyberButton';
import { AnimatedCard } from '../ui/animatedCard';

interface CommentsPanelProps {
  projectId: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function CommentItem({
  comment,
  onUpdate,
  onDelete,
}: {
  comment: Comment;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        background: 'var(--glass-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: 'var(--color-text-bright)', fontSize: '0.875rem', fontWeight: 500 }}>
              {comment.userName}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              {formatRelativeTime(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' (edited)'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm)',
              background: 'var(--glass-bg-active)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              resize: 'vertical',
              minHeight: 60,
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{comment.content}</div>
      )}
    </div>
  );
}

export function CommentsPanel({ projectId }: CommentsPanelProps) {
  const { getComments, addComment, updateComment, deleteComment } = useComments();
  const [newComment, setNewComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments = getComments(projectId);

  const handleSubmit = () => {
    if (newComment.trim()) {
      addComment(projectId, newComment.trim());
      setNewComment('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <AnimatedCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        <MessageSquare size={20} style={{ color: 'var(--color-accent)' }} />
        <h4 style={{ color: 'var(--color-text-bright)', margin: 0 }}>
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {/* Comment input */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... (Ctrl+Enter to submit)"
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text)',
            resize: 'vertical',
            minHeight: 80,
            marginBottom: 'var(--spacing-sm)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CyberButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
          >
            <Send size={14} style={{ marginRight: 'var(--spacing-xs)' }} />
            Post Comment
          </CyberButton>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
            No comments yet. Be the first to add one!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={updateComment}
              onDelete={deleteComment}
            />
          ))
        )}
      </div>
    </AnimatedCard>
  );
}
