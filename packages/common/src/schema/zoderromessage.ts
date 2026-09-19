import { ZodError } from "zod"

export const zodErrorMessage = ({error}: {error: ZodError}) => {
    return error.issues
        .map((er) => {`error:${er.input}, message: ${er.message}`})
        .join(",");
}