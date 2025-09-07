import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { StatusCode } from 'status-code-enum'

export const validateQueryParams = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.query);
        next();
    } catch (e) {
        if (e instanceof ZodError) {
            return res.status(StatusCode.ClientErrorBadRequest).json({
                error: "Validation failed",
                data: e
            });
        }
    }
}