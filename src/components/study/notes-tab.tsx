"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando notas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isCreating ? (
        <Button onClick={() => setIsCreating(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota
        </Button>
      ) : (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Escreva sua nota aqui..."
            className="min-h-[120px] resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={createNote} size="sm" disabled={!newNoteContent.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewNoteContent("");
              }}
              size="sm"
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2">Nenhuma nota ainda</p>
          <p className="text-sm text-muted-foreground">
            Crie notas para organizar seus estudos
          </p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-4 border rounded-lg bg-card hover:border-primary/30 transition-colors"
          >
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateNote(note.id)}
                    size="sm"
                    disabled={!editContent.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap mb-3">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(note.updatedAt)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
