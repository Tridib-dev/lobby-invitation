
export interface SavedProject {
    id : string;
    title : string;
    visibility : "public" | "private";
    manageAccess : "public" | "password";
    createdAt : string;
}

const KEY = "lobby:mine:v1";

export function loadMine() : SavedProject[] {
    try {
        const raw = localStorage.getItem(KEY);
        const v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v) ? v : [];
    }catch{
        return [];
    }
}

export function saveMine(p : SavedProject) {
    try {
        const list = loadMine().filter((x) => x.id !== p.id);
        list.unshift(p);
        localStorage.setItem(KEY,JSON.stringify(list.slice(0,50)));
    } catch {}
}


export function removeMine(id : string) {
    try {
        localStorage.setItem(KEY,JSON.stringify(loadMine().filter((x) => x.id !== id)));
    } catch {}
}