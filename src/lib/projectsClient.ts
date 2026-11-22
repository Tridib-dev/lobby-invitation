
export type Design = {
    v : 1;
    theme : string;
    motif?: string;
    accent?: string;
    seal?: string;
    cardLayout?:string;
    ornament?: boolean;
    divider?: string;
    motion?: "off" | "subtle";
};

export interface newProject {
    title : string;
    startsAt : string;
    location : string;
    hostName : string;
    message : string;
    design : Design;
    visibility : "public" | "private";
    password? : string; 
    manageAccess : "public" | "password";
    managePassword?: string;
}

export type ProjectView = 
| { locked : true ; id : string ; visibility : "private" }
| {
    locked?: false;
    id : string;
    title : string;
    location : string;
    hostName : string;
    message : string;
    startsAt : string,
    design : Design;
    visibility : "public" | "private";
}


export async function createProject(p: newProject) : Promise<{id : string}> {
    const res = await fetch("/api/projects" , {
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify(p),
    })
    const data= await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.error ?? "Could not create the invitation");
    return data
}


export async function  fetchProject(id : string , password?: string) : Promise<{status : number ; project?: ProjectView}> {
    const res = await fetch(`/api/projects/${id}` , {
        headers : password ? {"x-password" : password } : {},
        cache : "no-store",
    });
    if (res.status === 404) return {status : 404};
    return { status : res.status , project : await res.json() };
}