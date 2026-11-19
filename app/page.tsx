"use client";

import { useState , type FormEvent } from "react";
import { encodeInvitePayload } from "@/src/lib/codec";
import { DEFAULT_ACCENT, INVITE_VERSION, LIMITS , type InvitePayload } from "@/src/types/invite";


export default function Home() {
  const [InviteUrl,setInviteUrl ] = useState("");

  function createInvite(event : FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const data = new FormData(event.currentTarget);

    const payload : InvitePayload = {
      v : INVITE_VERSION,
      title : String(data.get("title") ?? ""),
      host : String( data.get("host") ?? ""),
      guest : String( data.get("guest") ?? ""),
      date : new Date(
        String(data.get("date") ?? "")
      ).toISOString(),
      
      location: String(data.get("location") ?? ""),
      note : String(data.get("note") ?? ""),
      template : "classic",
      accent : DEFAULT_ACCENT,
    }

    const encoded = encodeInvitePayload(payload);

    setInviteUrl(
      `${window.location.origin}/i/${encoded}`
    );
  }
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-900">
      <section className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-semibold">
          Create an invitation
        </h1>

        <p className="mb-8 text-neutral-500">
          craft the besty invitaion card you have ever devoloped :)
        </p>


        <form onSubmit={createInvite} className="space-y-5">
          <label className="block">
            Event title

            <input 
              name="title"
              required
              maxLength={LIMITS.title}
              placeholder=" A night to remeber !"
              className="mt-2 w-full rounded-xl border bg-white p-3" 
            />
          </label>
          <label className="block">
            Host

            <input 
              name="host"
              maxLength={LIMITS.host}
              placeholder="Your name "
              className="mt-2 w-full rounded-xl border bg-white p-3" 
            />
          </label>
          <label className="block">
            Guest name

            <input 
              name="guest"
              maxLength={LIMITS.guest}
              placeholder=" Invite someone "
              className="mt-2 w-full rounded-xl border bg-white p-3" 
            />
          </label>
          <label className="block">
            Date and time
            <input 
              name="date"
              type="datetime-local"
              required
              className="mt-2 w-full rounded-xl border bg-white p-3" 
            />
          </label>

          <label className="block">
            Location

            <input 
              name="location"
              maxLength={LIMITS.location}
              placeholder="Venue and location"
              className="mt-2 w-full rounded-xl border bg-white p-3" 
            />
          </label>

          <label className="block">
            Personal note
            <textarea
              name="note"
              maxLength={LIMITS.note}
              rows={3}
              placeholder="Add a little personal touch in ur invitation :).."
              className="mt-2 w-full rounded-xl border bg-white p-3"
            />
          </label>

          <button type="submit" className="w-full rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white">
            Genrate invitation 📤
          </button>
        </form>

        {InviteUrl && (
          <div className="mt-8 rounded-xl border bg-white p-5">
            <p className="mb-3 font-medium">
              Your invitation is ready.
            </p>

            <a
              href={InviteUrl}
              className="break-all text-blue-600 underline"
            >
              Open invitation
            </a>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(InviteUrl)}
              className="mt-4 block rounded-lg bg-neutral-100 px-4 py-2"
            >
              Copy invitation link
            </button>
          </div>
        )}
      </section>
    </main>
  )
}