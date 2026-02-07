/**
 * Re-define DataType enum locally to avoid Prisma import issues.
 * Must match Prisma schema exactly.
 *
 * This follows the same pattern as PolicyEffect enum in policy-evaluator.service.ts
 * to work around Prisma v7 import limitations.
 */
export enum DataType {
    STRING = 'STRING',
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DECIMAL = 'DECIMAL',
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    BOOLEAN = 'BOOLEAN',
    ENUM = 'ENUM',
    RELATION = 'RELATION',
    JSON = 'JSON',
}
