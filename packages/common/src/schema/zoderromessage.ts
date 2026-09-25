import { ZodError } from "zod"

export const zodErrorMessage = ({error}: {error: ZodError}) => {
    return error.issues
        .map((er) => `${er.path.join(".") || "field"}: ${er.message}`)
        .join(", ");
}