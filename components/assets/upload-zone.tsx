"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import { Asset, AssetType } from "@/src/lib/storyflow/types";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";

type Props = {
  projectId: string;
  assetType: AssetType;
  onUploaded: (asset: Asset) => void;
};

export function UploadZone({ projectId, assetType, onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        setProgress(0);
        const form = new FormData();
        form.append("file", file);
        form.append("projectId", projectId);
        form.append("type", assetType);

        const res = await axios.post("/api/assets/upload", form, {
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          },
        });

        onUploaded(res.data.asset as Asset);
        toast({
          title: "Upload complete",
          description: file.name,
          variant: "success",
        });
      } catch (error: any) {
        const detail =
          error?.response?.data?.error || error?.message || "Upload failed";
        toast({ title: "Upload error", description: detail, variant: "error" });
      } finally {
        setProgress(null);
      }
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div
      data-testid="upload-zone"
      className={cn(
        "rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center transition",
        isDragging && "border-brand-500 bg-brand-500/5"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        data-testid="upload-file-input"
        className="hidden"
        multiple
        accept={
          assetType === "IMAGE"
            ? "image/jpeg,image/png,image/webp"
            : assetType === "VIDEO"
              ? "video/mp4,video/webm,video/quicktime"
              : "audio/mpeg,audio/wav,audio/ogg"
        }
        onChange={onInputChange}
      />

      {progress !== null ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-200">Uploading… {progress}%</p>
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-brand-500 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-brand-300">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-200">Drag and drop files here</p>
          <p className="text-xs text-slate-400">or click to browse</p>
          <p className="text-[11px] text-slate-500">
            {assetType === "IMAGE"
              ? "JPEG, PNG, WebP up to 50MB"
              : assetType === "VIDEO"
                ? "MP4, WebM, MOV up to 500MB"
                : "MP3, WAV, OGG up to 50MB"}
          </p>
        </div>
      )}
    </div>
  );
}
