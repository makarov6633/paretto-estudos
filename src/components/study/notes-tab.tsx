"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type UserNote = {
  id: string;
  userId: string;
  itemId: string;
  sectionId: string | null;
  content: string;
  isStructured: boolean;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

type NotesTabProps = {
  itemId: string;
};

export function NotesTab({ itemId }: NotesTabProps) {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${itemId}`);
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [itemId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const response = await fetch(`/api/notes/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent,
          isStructured: false,
          tags: null,
        }),
      });

      if (response.ok) {
        const note = await response.json();
        setNotes((prev) => [note, ...prev]);
        setNewNoteContent("");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const updateNote = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/notes/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          content: editContent,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updated : note))
        );
        setEditingId(null);
        setEditContent("");
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      const response = await fetch(`/api/notes/${itemId}?noteId=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const startEdit = (note: UserNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="notepad-container">
      {/* Apple-style notepad header */}
      <div className="notepad-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Minhas Notas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</p>
          </div>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="notepad-button-primary"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Nova</span>
          </button>
        )}
      </div>

      {/* Create new note - Apple Notes style */}
      {isCreating && (
        <div className="notepad-editor animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="notepad-paper">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Comece a escrever..."
              className="notepad-textarea"
              autoFocus
              rows={8}
            />
          </div>
          <div className="notepad-actions">
            <button
              onClick={createNote}
              disabled={!newNoteContent.trim()}
              className="notepad-button-save"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              <span>Salvar</span>
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNoteContent("");
              }}
              className="notepad-button-cancel"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Notes list - Apple Notes cards style */}
      <div className="notepad-notes-list">
        {notes.length === 0 && !isCreating && (
          <div className="notepad-empty">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-gray-400 dark:text-gray-600" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhuma nota ainda</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crie sua primeira nota para começar
            </p>
          </div>
        )}

        {notes.map((note, index) => (
          <div
            key={note.id}
            className="notepad-note-card group"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {editingId === note.id ? (
              <div className="space-y-3">
                <div className="notepad-paper">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="notepad-textarea"
                    autoFocus
                    rows={6}
                  />
                </div>
                <div className="notepad-actions">
                  <button
                    onClick={() => updateNote(note.id)}
                    disabled={!editContent.trim()}
                    className="notepad-button-save"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    <span>Salvar</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="notepad-button-cancel"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="notepad-note-content">
                  <p className="notepad-text">{note.content}</p>
                </div>
                <div className="notepad-note-footer">
                  <span className="notepad-date">{formatDate(note.updatedAt)}</span>
                  <div className="notepad-note-actions">
                    <button
                      onClick={() => startEdit(note)}
                      className="notepad-icon-button"
                      title="Editar nota"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="notepad-icon-button notepad-icon-button-danger"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .notepad-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notepad-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .notepad-header {
          border-bottom-color: rgba(255, 255, 255, 0.06);
        }

        .notepad-button-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          background: linear-gradient(180deg, #007AFF 0%, #0051D5 100%);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 122, 255, 0.3), 0 1px 2px rgba(0, 122, 255, 0.2);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .notepad-button-primary:hover {
          background: linear-gradient(180deg, #0051D5 0%, #003DB5 100%);
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4), 0 2px 4px rgba(0, 122, 255, 0.3);
          transform: translateY(-1px);
        }

        .notepad-button-primary:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 122, 255, 0.3);
        }

        .notepad-editor {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notepad-paper {
          position: relative;
          background: linear-gradient(to bottom, 
            rgba(255, 251, 235, 0.95) 0%,
            rgba(254, 249, 231, 0.95) 100%
          );
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.05),
            0 1px 2px rgba(0, 0, 0, 0.03),
            inset 0 0 0 1px rgba(251, 191, 36, 0.1);
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 1.5rem,
              rgba(251, 191, 36, 0.08) 1.5rem,
              rgba(251, 191, 36, 0.08) calc(1.5rem + 1px)
            );
          background-position: 0 0.5rem;
        }

        .dark .notepad-paper {
          background: linear-gradient(to bottom,
            rgba(44, 38, 25, 0.95) 0%,
            rgba(38, 32, 20, 0.95) 100%
          );
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.2),
            inset 0 0 0 1px rgba(251, 191, 36, 0.15);
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 1.5rem,
              rgba(251, 191, 36, 0.06) 1.5rem,
              rgba(251, 191, 36, 0.06) calc(1.5rem + 1px)
            );
        }

        .notepad-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 1rem;
          line-height: 1.5rem;
          color: #1d1d1f;
          font-weight: 400;
          letter-spacing: -0.01em;
          padding: 0;
        }

        .dark .notepad-textarea {
          color: #f5f5f7;
        }

        .notepad-textarea::placeholder {
          color: rgba(60, 60, 67, 0.4);
        }

        .dark .notepad-textarea::placeholder {
          color: rgba(235, 235, 245, 0.3);
        }

        .notepad-textarea:focus {
          outline: none;
        }

        .notepad-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 0.5rem;
        }

        .notepad-button-save {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(180deg, #34C759 0%, #30A14E 100%);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          box-shadow: 0 1px 3px rgba(52, 199, 89, 0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .notepad-button-save:hover:not(:disabled) {
          background: linear-gradient(180deg, #30A14E 0%, #2D8F47 100%);
          box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
          transform: translateY(-1px);
        }

        .notepad-button-save:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(52, 199, 89, 0.3);
        }

        .notepad-button-save:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .notepad-button-cancel {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          background: rgba(120, 120, 128, 0.08);
          color: #1d1d1f;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .dark .notepad-button-cancel {
          background: rgba(235, 235, 245, 0.08);
          color: #f5f5f7;
        }

        .notepad-button-cancel:hover {
          background: rgba(120, 120, 128, 0.12);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }

        .dark .notepad-button-cancel:hover {
          background: rgba(235, 235, 245, 0.12);
        }

        .notepad-button-cancel:active {
          transform: scale(0.98);
        }

        .notepad-notes-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .notepad-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          text-align: center;
        }

        .notepad-note-card {
          position: relative;
          background: linear-gradient(to bottom, 
            rgba(255, 251, 235, 1) 0%,
            rgba(254, 249, 231, 1) 100%
          );
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.04),
            inset 0 0 0 1px rgba(251, 191, 36, 0.12);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          animation: noteSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 1.5rem,
              rgba(251, 191, 36, 0.05) 1.5rem,
              rgba(251, 191, 36, 0.05) calc(1.5rem + 1px)
            );
          background-position: 0 0.35rem;
        }

        .dark .notepad-note-card {
          background: linear-gradient(to bottom,
            rgba(44, 38, 25, 1) 0%,
            rgba(38, 32, 20, 1) 100%
          );
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.4),
            0 1px 2px rgba(0, 0, 0, 0.3),
            inset 0 0 0 1px rgba(251, 191, 36, 0.15);
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 1.5rem,
              rgba(251, 191, 36, 0.04) 1.5rem,
              rgba(251, 191, 36, 0.04) calc(1.5rem + 1px)
            );
        }

        .notepad-note-card:hover {
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.06),
            inset 0 0 0 1px rgba(251, 191, 36, 0.2);
          transform: translateY(-2px);
        }

        .dark .notepad-note-card:hover {
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.6),
            0 2px 4px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(251, 191, 36, 0.25);
        }

        @keyframes noteSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notepad-note-content {
          margin-bottom: 1rem;
        }

        .notepad-text {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.5rem;
          color: #1d1d1f;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .dark .notepad-text {
          color: #f5f5f7;
        }

        .notepad-note-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .notepad-note-footer {
          border-top-color: rgba(255, 255, 255, 0.06);
        }

        .notepad-date {
          font-size: 0.6875rem;
          font-weight: 500;
          color: rgba(60, 60, 67, 0.6);
          letter-spacing: -0.01em;
        }

        .dark .notepad-date {
          color: rgba(235, 235, 245, 0.6);
        }

        .notepad-note-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .group:hover .notepad-note-actions {
          opacity: 1;
        }

        .notepad-icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          background: rgba(120, 120, 128, 0.08);
          color: #1d1d1f;
          border: none;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .dark .notepad-icon-button {
          background: rgba(235, 235, 245, 0.08);
          color: #f5f5f7;
        }

        .notepad-icon-button:hover {
          background: rgba(120, 120, 128, 0.16);
          transform: scale(1.05);
        }

        .dark .notepad-icon-button:hover {
          background: rgba(235, 235, 245, 0.16);
        }

        .notepad-icon-button:active {
          transform: scale(0.95);
        }

        .notepad-icon-button-danger:hover {
          background: rgba(255, 59, 48, 0.12);
          color: #FF3B30;
        }

        .dark .notepad-icon-button-danger:hover {
          background: rgba(255, 69, 58, 0.16);
          color: #FF453A;
        }

        @media (max-width: 640px) {
          .notepad-note-actions {
            opacity: 1;
          }
          
          .notepad-icon-button {
            width: 2.75rem;
            height: 2.75rem;
          }
        }
      `}</style>
    </div>
  );
}
