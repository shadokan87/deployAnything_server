import z from "zod";

export const repoDiagnosticSchema = z.object({
    org: z.string(),
    name: z.string(),
    access_token: z.string()
});