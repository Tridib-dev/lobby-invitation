"use client";

export default function SoundToggle({
    muted,
    appleUrl,
    onToggle,
} : {
    muted : boolean;
    appleUrl : string | null;
    onToggle : () => void;
}) {
    return (
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
            <button type="button" onClick={onToggle} aria-label={muted ? "Unmute-music" : "Mute-music"}>
                {muted ? "🔇" : "🔊"}
            </button>
            {appleUrl && (
                <a href={appleUrl} target="_blank" rel="noreferrer" className="underline" >
                    Listen on Apple music :{">"}
                </a>
            )}
        </div>
    );
}