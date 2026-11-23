import {z} from "zod";
 
export const DesignSchema = z.object({
    v : z.literal(1),
    theme : z.string().max(40),
    motif : z.string().max(40).optional(),
    accent : z.string().max(40).optional(),
    seal : z.string().max(40).optional(),
    cardLayout : z.string().max(40).optional(),
    ornament : z.boolean().optional(),
    divider : z.string().max(40).optional(),
    motion : z.enum(["off","subtle"]).optional(),
})

export const CreateSchema = z.object({
    title : z.string().trim().min(1).max(80),
    startsAt : z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid Date"),
    location : z.string().trim().max(120).default(""),
    hostName : z.string().trim().max(60).default(""),
    message : z.string().max(400).default(""),
    design : DesignSchema,
    visibility : z.enum(["public","private"]), 
    password : z.string().min(4).max(72).optional(),
    manageAccess : z.enum(["public" , "password"]).default("public"),
    managePassword : z.string().min(4).max(72).optional(),
}).superRefine((d , ctx) => {
    if(d.visibility === "private" && !d.password) {
        ctx.addIssue({ code : "custom" , message : "A password-protected invitation needs a password" , path: ["password"] });
    }
    if(d.manageAccess === "password" && !d.managePassword) {
        ctx.addIssue({ code : "custom" , message : "A password-protected control centre needs a password" , path : ["managePassword"] });
    }
    if(d.visibility === "private" && d.manageAccess !== "password"){
        ctx.addIssue({
            code : "custom",
            message : "A password protected invitation needs a password protected control center",
            path : ["manageAccess"],
        });
    } 
});


export const UpdateSchema = z.object ({
    title : z.string().trim().min(1).max(80).optional(),
    startsAt : z.string().refine((s) => !Number.isNaN(Date.parse(s)) , "Invalid date").optional(),
    location : z.string().trim().max(120).optional(),
    hostName : z.string().trim().max(60).optional(),
    message : z.string().trim().max(400).optional(),
    design : DesignSchema.optional().optional(),
    visibility : z.enum(["public" , "private"]).optional(),
    password : z.string().min(4).max(72).optional(),
    manageAccess : z.enum(["public" , "private"]).optional(),
    managePassword : z.string().min(4).max(72).optional(),
}).partial();