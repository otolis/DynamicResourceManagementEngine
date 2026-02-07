import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsContextType {
  comments: Record<string, Comment[]>; // projectId -> comments
  getComments: (projectId: string) => Comment[];
  addComment: (projectId: string, content: string) => void;
  updateComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  getCommentCount: (projectId: string) => number;
}

const CommentsContext = createContext<CommentsContextType | null>(null);

const STORAGE_KEY = 'drme:comments';

export function CommentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }, [comments]);

  const getComments = (projectId: string): Comment[] => {
    return comments[projectId] || [];
  };

  const addComment = (projectId: string, content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      projectId,
      userId: user?.id || 'anonymous',
      userName: user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.email || 'Anonymous',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), newComment],
    }));
  };

  const updateComment = (commentId: string, content: string) => {
    setComments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((projectId) => {
        next[projectId] = next[projectId].map((c) =>
          c.id === commentId
            ? { ...c, content, updatedAt: new Date().toISOString() }
            : c
        );
      });
      return next;
    });
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((projectId) => {
        next[projectId] = next[projectId].filter((c) => c.id !== commentId);
      });
      return next;
    });
  };

  const getCommentCount = (projectId: string): number => {
    return (comments[projectId] || []).length;
  };

  return (
    <CommentsContext.Provider
      value={{
        comments,
        getComments,
        addComment,
        updateComment,
        deleteComment,
        getCommentCount,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
}
