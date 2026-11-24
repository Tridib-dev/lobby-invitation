import Link from "next/link";
import MyInvitations from "@/features/community/MyInvitations";
import Community from "@/features/community/Community";


export default  function Home () {
  return(
    <main className="min-h-screen bg-neutral-900 p-4 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-12 py-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-semibold">Lobby Invitations</h1>
          <p className="text-white/70">
            Create a beautiful 3D envelope invitation,share the link and manage it later. No account needed.
          </p>
          <Link
            href="/create"
            className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-black"
          >
            Create an invitation
          </Link>
        </header>
        <MyInvitations />
        <Community />
      </div>
    </main>
  );
}