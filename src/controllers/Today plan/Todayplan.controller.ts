import { Request, Response } from 'express';
import {
    servError,
    notFound
} from '../../responseObject';
import {
    todayPlanQuerySchema,
    todayPlanIdSchema,
    TodayPlanQueryParams
} from '../../models/Today plan/type.model';
import { ZodError } from 'zod';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/sequalizer';

const validateWithZod = <T>(schema: any, data: any): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>
} => {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error: any) {
        if (error instanceof ZodError) {
            const zodIssues = error.issues || (error as any).errors || [];

            return {
                success: false,
                errors: zodIssues.map((err: any) => ({
                    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown'),
                    message: err.message || 'Validation error'
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

// Helper function to safely extract string values from query parameters
const getStringValue = (param: any): string | null => {
    if (!param) return null;
    if (typeof param === 'string') return param;
    if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') return param[0];
    return null;
};

// Helper function to safely extract number values from query parameters
const getNumberValue = (param: any): number | null => {
    if (!param) return null;
    if (typeof param === 'string') {
        const num = Number(param);
        return isNaN(num) ? null : num;
    }
    if (typeof param === 'number') return param;
    return null;
};

// GET ALL with filters - NO PAGINATION, defaults to current date
export const getAllTodayPlans = async (req: Request, res: Response) => {
    try {
        const queryData = {
            schId: req.query.schId,
            taskWorkDate: req.query.taskWorkDate,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            startTime: req.query.startTime,
            endTime: req.query.endTime,
            taskId: req.query.taskId,
            projectId: req.query.projectId,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const validation = validateWithZod<TodayPlanQueryParams>(todayPlanQuerySchema, queryData);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const queryParams = validation.data!;

        // Build the WHERE conditions
        const whereConditions: string[] = [];
        const replacements: any[] = [];

        // If no date filters provided, default to current date
        if (!queryParams.taskWorkDate && !queryParams.dateFrom && !queryParams.dateTo) {
            const currentDate = new Date().toISOString().split('T')[0];
            whereConditions.push(`td.Task_Work_Date = ?`);
            replacements.push(currentDate);
        } else {
            // Handle Task_Work_Date filters
            if (queryParams.taskWorkDate) {
                whereConditions.push(`td.Task_Work_Date = ?`);
                replacements.push(queryParams.taskWorkDate);
            } else if (queryParams.dateFrom || queryParams.dateTo) {
                if (queryParams.dateFrom && queryParams.dateTo) {
                    whereConditions.push(`td.Task_Work_Date BETWEEN ? AND ?`);
                    replacements.push(queryParams.dateFrom, queryParams.dateTo);
                } else if (queryParams.dateFrom) {
                    whereConditions.push(`td.Task_Work_Date >= ?`);
                    replacements.push(queryParams.dateFrom);
                } else if (queryParams.dateTo) {
                    whereConditions.push(`td.Task_Work_Date <= ?`);
                    replacements.push(queryParams.dateTo);
                }
            }
        }

        // Handle Sch_Id filter
        if (queryParams.schId) {
            whereConditions.push(`td.Sch_Id = ?`);
            replacements.push(queryParams.schId);
        }

        // Handle time filters
        if (queryParams.startTime) {
            whereConditions.push(`td.Task_Start_Time = ?`);
            replacements.push(queryParams.startTime);
        }

        if (queryParams.endTime) {
            whereConditions.push(`td.Task_End_Time = ?`);
            replacements.push(queryParams.endTime);
        }

        // Handle Task filter
        if (queryParams.taskId) {
            whereConditions.push(`s.Task_Id = ?`);
            replacements.push(queryParams.taskId);
        }

        // Handle Project filter
        if (queryParams.projectId) {
            whereConditions.push(`t.Project_Id = ?`);
            replacements.push(queryParams.projectId);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Determine sort field
        let sortField = 'td.Task_Work_Date';
        if (queryParams.sortBy === 'Task_Name') {
            sortField = 't.Task_Name';
        } else if (queryParams.sortBy === 'Project_Name') {
            sortField = 'pm.Project_Name';
        } else if (queryParams.sortBy === 'A_Id') {
            sortField = 'td.A_Id';
        } else if (queryParams.sortBy === 'Sch_Id') {
            sortField = 'td.Sch_Id';
        } else if (queryParams.sortBy === 'Task_Start_Time') {
            sortField = 'td.Task_Start_Time';
        } else if (queryParams.sortBy === 'Task_End_Time') {
            sortField = 'td.Task_End_Time';
        }

        // Get all data with JOINs - NO PAGINATION
        const dataQuery = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            ${whereClause}
            ORDER BY ${sortField} ${queryParams.sortOrder || 'ASC'}
        `;

        console.log('Data Query:', dataQuery);
        console.log('Replacements:', replacements);

        const rows = await sequelize.query(dataQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        }) as any[];

        // Get total count for informational purposes
        const countQuery = `
            SELECT COUNT(*) as total
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            ${whereClause}
        `;

        const countResult = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        }) as any[];

        const total = countResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for the specified criteria',
            data: rows,
            total: total
        });

    } catch (err) {
        console.error('Error fetching today plans:', err);
        servError(err, res);
    }
};

// GET BY ID with Task Name
export const getTodayPlanById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            todayPlanIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            WHERE td.A_Id = ?
        `;

        const rows = await sequelize.query(query, {
            replacements: [id],
            type: QueryTypes.SELECT
        }) as any[];

        if (!rows.length) {
            return notFound(res, 'Today Plan not found');
        }

        return res.status(200).json({
            success: true,
            message: 'Today Plan fetched successfully',
            data: rows[0]
        });

    } catch (e) {
        console.error('Error fetching today plan by ID:', e);
        servError(e, res);
    }
};

// GET BY SCHEDULE ID with Task Name
export const getTodayPlansBySchedule = async (req: Request, res: Response) => {
    try {
        const schIdValue = getNumberValue(req.params.schId);

        if (!schIdValue) {
            return res.status(400).json({
                success: false,
                message: 'Valid Schedule ID is required'
            });
        }

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            WHERE td.Sch_Id = ?
            ORDER BY td.Task_Work_Date DESC, td.Task_Start_Time ASC
        `;

        const rows = await sequelize.query(query, {
            replacements: [schIdValue],
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for this schedule',
            data: rows
        });

    } catch (e) {
        console.error('Error fetching today plans by schedule:', e);
        servError(e, res);
    }
};

// GET BY TASK ID with filters
export const getTodayPlansByTask = async (req: Request, res: Response) => {
    try {
        const taskId = getNumberValue(req.params.taskId);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Valid Task ID is required'
            });
        }

        const dateFrom = getStringValue(req.query.dateFrom);
        const dateTo = getStringValue(req.query.dateTo);

        let whereConditions = ['s.Task_Id = ?'];
        const replacements: any[] = [taskId];

        if (dateFrom && dateTo) {
            whereConditions.push('td.Task_Work_Date BETWEEN ? AND ?');
            replacements.push(dateFrom, dateTo);
        } else if (dateFrom) {
            whereConditions.push('td.Task_Work_Date >= ?');
            replacements.push(dateFrom);
        } else if (dateTo) {
            whereConditions.push('td.Task_Work_Date <= ?');
            replacements.push(dateTo);
        } else {
            // Default to current date if no date filters provided
            const currentDate = new Date().toISOString().split('T')[0];
            whereConditions.push('td.Task_Work_Date = ?');
            replacements.push(currentDate);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            INNER JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            ${whereClause}
            ORDER BY td.Task_Work_Date DESC, td.Task_Start_Time ASC
        `;

        const rows = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for this task',
            data: rows
        });

    } catch (e) {
        console.error('Error fetching today plans by task:', e);
        servError(e, res);
    }
};

// GET BY PROJECT ID
export const getTodayPlansByProject = async (req: Request, res: Response) => {
    try {
        const projectId = getNumberValue(req.params.projectId);

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Valid Project ID is required'
            });
        }

        const dateFrom = getStringValue(req.query.dateFrom);
        const dateTo = getStringValue(req.query.dateTo);

        let whereConditions = ['pm.Project_Id = ?'];
        const replacements: any[] = [projectId];

        if (dateFrom && dateTo) {
            whereConditions.push('td.Task_Work_Date BETWEEN ? AND ?');
            replacements.push(dateFrom, dateTo);
        } else if (dateFrom) {
            whereConditions.push('td.Task_Work_Date >= ?');
            replacements.push(dateFrom);
        } else if (dateTo) {
            whereConditions.push('td.Task_Work_Date <= ?');
            replacements.push(dateTo);
        } else {
            // Default to current date if no date filters provided
            const currentDate = new Date().toISOString().split('T')[0];
            whereConditions.push('td.Task_Work_Date = ?');
            replacements.push(currentDate);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            INNER JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            INNER JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            ${whereClause}
            ORDER BY td.Task_Work_Date DESC, td.Task_Start_Time ASC
        `;

        const rows = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for this project',
            data: rows
        });

    } catch (e) {
        console.error('Error fetching today plans by project:', e);
        servError(e, res);
    }
};

// GET BY DATE RANGE with Task Name
export const getTodayPlansByDateRange = async (req: Request, res: Response) => {
    try {
        const startDate = getStringValue(req.query.startDate);
        const endDate = getStringValue(req.query.endDate);

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            WHERE td.Task_Work_Date BETWEEN ? AND ?
            ORDER BY td.Task_Work_Date ASC, td.Task_Start_Time ASC
        `;

        const rows = await sequelize.query(query, {
            replacements: [startDate, endDate],
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for the specified date range',
            data: rows
        });

    } catch (e) {
        console.error('Error fetching today plans by date range:', e);
        servError(e, res);
    }
};

// GET BY SPECIFIC DATE with Task Name
export const getTodayPlansByDate = async (req: Request, res: Response) => {
    try {
        const date = getStringValue(req.params.date);

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Valid date is required (YYYY-MM-DD)'
            });
        }

        const query = `
            SELECT 
                td.A_Id,
                td.Sch_Id,
                td.Task_Work_Date,
                td.Task_Start_Time,
                td.Task_End_Time,
                s.Sch_No,
                t.Task_Id,
                t.Task_Name,
                pm.Project_Id,
                pm.Project_Name
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            WHERE td.Task_Work_Date = ?
            ORDER BY td.Task_Start_Time ASC
        `;

        const rows = await sequelize.query(query, {
            replacements: [date],
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: rows.length > 0 ? 'Today Plans fetched successfully' : 'No records found for the specified date',
            data: rows
        });

    } catch (e) {
        console.error('Error fetching today plans by date:', e);
        servError(e, res);
    }
};

// Get summary statistics
export const getTodayPlansSummary = async (req: Request, res: Response) => {
    try {
        const date = getStringValue(req.query.date) || new Date().toISOString().split('T')[0];

        const query = `
            SELECT 
                COUNT(*) as totalTasks,
                COUNT(CASE WHEN td.Task_Start_Time IS NOT NULL THEN 1 END) as tasksWithStartTime,
                COUNT(CASE WHEN td.Task_End_Time IS NOT NULL THEN 1 END) as tasksWithEndTime,
                COUNT(DISTINCT s.Task_Id) as uniqueTasks,
                COUNT(DISTINCT t.Project_Id) as uniqueProjects
            FROM tbl_Project_Sch_Task_DT td
            INNER JOIN tbl_Project_Schedule s ON td.Sch_Id = s.Sch_Id AND s.Sch_Del_Flag = 0
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            WHERE td.Task_Work_Date = ?
        `;

        const rows = await sequelize.query(query, {
            replacements: [date],
            type: QueryTypes.SELECT
        }) as any[];

        return res.status(200).json({
            success: true,
            message: 'Today Plans summary fetched successfully',
            data: rows[0]
        });

    } catch (e) {
        console.error('Error fetching today plans summary:', e);
        servError(e, res);
    }
};