"use client";

import { useActionState, useState } from "react";
import { Camera } from "lucide-react";
import { updateCoverImage, type CoverImageState } from "./actions";
import { Button } from "@/components/ui";

export default function CoverImageForm({
  groupId,
  coverImageUrl,
}: {
  groupId: string;
  coverImageUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<CoverImageState, FormData>(
    updateCoverImage.bind(null, groupId),
    {},
  );
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  const shown = preview ?? coverImageUrl;

  return (
    <form action={formAction} className="space-y-3">
      <label
        htmlFor="cover"
        className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-hover"
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-muted" aria-hidden="true" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-6 w-6 text-white" aria-hidden="true" />
        </span>
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}

      <Button type="submit" variant="outline" size="sm" fullWidth disabled={pending}>
        {pending ? "Enviando..." : "Salvar capa"}
      </Button>
    </form>
  );
}
