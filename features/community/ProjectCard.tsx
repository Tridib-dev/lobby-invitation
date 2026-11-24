import Link from "next/link";

export default function ProjectCard({
    id,
    title,
    visibility,
    manageAccess,
} : {
    id : string;
    title : string;
    visibility : "public" | "private";
    manageAccess?: "public" | "password";
}) {
    return (
        <Link
            href={`/edit/${id}`}
            className="block rounded-xl border border-white/10 bg-white/5 p-4 transistion hover:border-white/40"
        >
            <p className="truncate font-medium text-white">{title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-white/70">
                <span className="rounded-full bg-white/10 px-2 py-0.5">
                    Viewing : {visibility === "private" ? "Password" : "Public"}
                </span>
                {manageAccess && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5">
                        Control : {manageAccess === "password" ? "Password" : "Open"}
                    </span>
                )}
            </div>
        </Link>
    );
}