"use client";

import { useActionState, useState } from "react";
import { Camera } from "lucide-react";
import { updateProfile, type ProfileState } from "./actions";
import { Button, Input } from "@/components/ui";

export default function ProfileForm({
  displayName,
  nickname,
  avatarUrl,
}: {
  displayName: string;
  nickname: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  const shownAvatar = preview ?? avatarUrl;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex justify-center">
        <label
          htmlFor="avatar"
          className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-surface-hover"
        >
          {shownAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-muted">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      <Input type="text" name="display_name" label="Nome" required defaultValue={displayName} />
      <Input
        type="text"
        name="nickname"
        label="Apelido (opcional)"
        defaultValue={nickname ?? ""}
        placeholder="Como te chamam no grupo"
      />

      {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-center text-sm text-primary">Salvo!</p> : null}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
