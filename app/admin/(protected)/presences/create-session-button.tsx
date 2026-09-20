"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createTodaySession } from "@/app/admin/(protected)/actions";

export function CreateSessionButton({
  groupName,
  sessionDate,
  label,
}: {
  groupName: string;
  sessionDate: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn w-full sm:w-auto"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("groupName", groupName);
          formData.set("sessionDate", sessionDate);
          await createTodaySession(formData);
          router.refresh();
        })
      }
    >
      {pending ? "Création…" : label}
    </button>
  );
}
