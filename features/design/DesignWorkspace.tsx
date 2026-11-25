import type { ReactNode } from "react";


export default function DesignWorkSpace({
    preview,
    children,
} : {
    preview : ReactNode;
    children : ReactNode;
}) {
    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-8">
            <div className="sticky top-0 z-10 -mx-4 h-[38vh] min-h-60 bg-neutral-900 px-4 py-2 md:h-[46vh] lg:top-4 lg:mx-0 lg:h-[calc(100vh-2rem)] lg:bg-transparent lg:p-0">
                <div className="h-full w-full overflow-hidden rounded-2xl bg-black/30">{preview}</div>
            </div>
            <div className="min-w-0 space-y-6 pb-8">{children}</div>
        </div>
    );
}