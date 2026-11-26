export function formatWhen(startsAt : string) : string {
    const d = new Date(startsAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN" , {
        dateStyle : "full",
        timeStyle: "short",
        timeZone : "Asia/Kolkata",
    });
}