"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { useUploadBoardImage } from "@/src/hooks/queries/use-boards";
import { cn } from "@/src/lib/storyflow/utils";

interface ImageUploaderProps {
  projectId: string;
  boardId: string;
  onUploadComplete: (imagePath: string) => void;
  className?: string;
}

export function ImageUploader({ projectId, boardId, onUploadComplete, className }: ImageUploaderProps) {
  const toast = useToast();
  const uploadMutation = useUploadBoardImage(projectId);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const validateImage = async (file: File): Promise<void> => {
    // Validate file size (max 50MB)
    const maxSizeMB = 50;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`Image is too large. Max size: ${maxSizeMB}MB`);
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only PNG, JPEG, and WebP are supported.");
    }

    // Validate dimensions (min 2048x2048)
    const minDimension = 2048;
    const img = await createImageBitmap(file);
    if (img.width < minDimension || img.height < minDimension) {
      throw new Error(`Image is too small. Minimum dimensions: ${minDimension}x${minDimension}px`);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      // Validate the image first
      await validateImage(file);
    } catch (error: any) {
      toast({ title: "Validation failed", description: error.message, variant: "error" });
      return;
    }
    setUploading(true);
    uploadMutation.mutate(
      { file, boardId },
      {
        onSuccess: (data) => {
          setUploadedImage(data.imagePath);
          onUploadComplete(data.imagePath);
          toast({ title: "Image uploaded successfully", variant: "success" });
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Upload failed";
          toast({ title: "Upload failed", description: message, variant: "error" });
        },
        onSettled: () => setUploading(false),
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Upload Board Image</h3>
        <p className="text-xs text-slate-400">
          Upload the AI-generated image for <span className="font-mono text-brand-400">{boardId}</span>
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition",
          dragActive
            ? "border-brand-500 bg-brand-950/30"
            : "border-slate-700 bg-slate-900/50 hover:border-slate-600",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {uploadedImage ? (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative mx-auto max-w-md overflow-hidden rounded-lg border border-slate-700">
              <img
                src={`/projects/${projectId}/${uploadedImage}`}
                alt="Uploaded board"
                className="h-auto w-full"
              />
            </div>
            <div className="text-sm text-slate-300">
              <svg className="mx-auto mb-2 h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Image uploaded successfully
            </div>
            <Button size="sm" variant="outline" onClick={() => setUploadedImage(null)}>
              Upload Different Image
            </Button>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto mb-4 h-12 w-12 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mb-2 text-sm text-slate-300">
              {uploading ? "Uploading..." : "Drop image here or click to browse"}
            </p>
            <p className="mb-4 text-xs text-slate-500">
              PNG, JPEG, or WebP • Max 50MB • Min 2048x2048px
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id={`upload-${boardId}`}
            />
            <label htmlFor={`upload-${boardId}`}>
              <Button size="sm" variant="outline" disabled={uploading} asChild>
                <span>{uploading ? "Uploading..." : "Browse Files"}</span>
              </Button>
            </label>
          </>
        )}
      </div>

      {/* Requirements */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">Image Requirements</h4>
        <ul className="space-y-1 text-xs text-slate-500">
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Format: PNG, JPEG, or WebP</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Maximum file size: 50MB</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Minimum dimensions: 2048 x 2048 pixels</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Recommended: 4096 x 4096 or higher for best quality</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
