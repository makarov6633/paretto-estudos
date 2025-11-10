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
    <div className="space-y-4">
      {!isCreating ? (
        <button 
          onClick={() => setIsCreating(true)} 
          className="w-full rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/40 dark:hover:to-orange-950/40 transition-all duration-300 group active:scale-[0.98] p-4 min-h-[56px]"
        >
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
            <span className="font-semibold">Nova Nota</span>
          </div>
        </button>
      ) : (
        <div className="space-y-3 p-5 border-2 border-amber-300 dark:border-amber-700 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg shadow-amber-500/10">
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="✍️ Escreva sua nota aqui..."
            className="min-h-[140px] resize-none border-2 border-amber-200 dark:border-amber-800 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 bg-white/80 dark:bg-gray-950/50 font-medium"
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              onClick={createNote} 
              size="sm" 
              disabled={!newNoteContent.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-md min-h-[44px] px-4"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Nota
            </Button>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewNoteContent("");
              }}
              size="sm"
              variant="outline"
              className="border-2 min-h-[44px] px-4"
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
            className="group p-5 border-2 border-gray-200 dark:border-gray-800 rounded-2xl bg-white/50 dark:bg-gray-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
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
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-md min-h-[44px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline" className="border-2 min-h-[44px]">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap mb-4 leading-relaxed font-['Literata',Georgia,serif]">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-gray-200 dark:border-gray-800">
                  <span className="font-medium">{formatDate(note.updatedAt)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(note)}
                      className="rounded-lg transition-all active:scale-95 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Editar nota"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="rounded-lg transition-all active:scale-95 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Excluir nota"
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
