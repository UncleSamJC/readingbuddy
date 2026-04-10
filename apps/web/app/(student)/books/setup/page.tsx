"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChapterList } from "@/components/book-setup/ChapterList";
import { ChapterForm } from "@/components/book-setup/ChapterForm";
import { PLAN_CHAPTER_LIMITS } from "@readbuddy/shared-types";

export default function BookSetupPage() {
  const currentBook = useAppStore((s) => s.currentBook);
  const chapters = useAppStore((s) => s.chapters);
  const isBookLoading = useAppStore((s) => s.isBookLoading);
  const userPlan = useAppStore((s) => s.userPlan);
  const initBook = useAppStore((s) => s.initBook);
  const setBookTitle = useAppStore((s) => s.setBookTitle);
  const setBookAuthor = useAppStore((s) => s.setBookAuthor);
  const addChapter = useAppStore((s) => s.addChapter);
  const updateChapter = useAppStore((s) => s.updateChapter);
  const deleteChapter = useAppStore((s) => s.deleteChapter);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load book from backend on mount
  useEffect(() => {
    initBook();
  }, [initBook]);

  const editingChapter = editingId
    ? chapters.find((ch) => ch.id === editingId)
    : null;

  const maxChapters = PLAN_CHAPTER_LIMITS[userPlan];
  const canAddMore = chapters.length < maxChapters;

  async function handleAdd(title: string, rawText: string) {
    setIsSaving(true);
    const result = await addChapter(title, rawText);
    setIsSaving(false);
    if (result.ok) setShowForm(false);
    return result;
  }

  async function handleUpdate(title: string, rawText: string) {
    if (!editingId) return { ok: false, error: "No chapter selected" };
    setIsSaving(true);
    const result = await updateChapter(editingId, title, rawText);
    setIsSaving(false);
    if (result.ok) setEditingId(null);
    return result;
  }

  async function handleDelete(id: string) {
    if (editingId === id) setEditingId(null);
    await deleteChapter(id);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(false);
  }

  function handleShowAdd() {
    setEditingId(null);
    setShowForm(true);
  }

  if (isBookLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <p className="text-muted-foreground">Loading book data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book title */}
      <Card>
        <CardHeader>
          <CardTitle>Book Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Book Title
            </label>
            <Input
              value={currentBook?.title ?? ""}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="e.g. The Wild Robot"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Author
            </label>
            <Input
              value={currentBook?.author ?? ""}
              onChange={(e) => setBookAuthor(e.target.value)}
              placeholder="e.g. Peter Brown"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapter list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chapters</h2>
          {canAddMore && !showForm && !editingId && (
            <button
              onClick={handleShowAdd}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Add Chapter
            </button>
          )}
        </div>
        <ChapterList
          chapters={chapters}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit form */}
      {editingChapter && (
        <ChapterForm
          key={editingId}
          isEditing
          initialTitle={editingChapter.title}
          initialContent={editingChapter.raw_text}
          onSubmit={handleUpdate}
          onCancel={() => setEditingId(null)}
          disabled={isSaving}
        />
      )}

      {/* Add form */}
      {showForm && !editingId && (
        <ChapterForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          disabled={isSaving}
        />
      )}

      {/* Hint when chapters are full */}
      {!canAddMore && !editingId && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Maximum {maxChapters} chapters reached
          </p>
          <p className="mt-0.5">
            You are on the <span className="font-medium text-primary">{userPlan}</span> plan.
            {userPlan !== "Pro" && (
              <> To add more chapters, please contact admin to upgrade your plan.</>
            )}
          </p>
        </div>
      )}

      {/* Empty state: auto-show form */}
      {chapters.length === 0 && !showForm && (
        <ChapterForm onSubmit={handleAdd} disabled={isSaving} />
      )}

      {/* Copyright notice */}
      <p className="text-center text-xs text-muted-foreground">
        This feature is for personal family learning use only.
      </p>
    </div>
  );
}
