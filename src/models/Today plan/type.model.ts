import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Today_Plan';

export interface TodayplanAttributes {
    A_Id: number;
    Sch_Id: number | null;
    Task_Work_Date: Date | null;
    Task_Start_Time: string | null;
    Task_End_Time: string | null;
    // Extended fields for joined data (not in database)
    Task_Name?: string;
    Project_Name?: string;
    Sch_No?: string;
}

type TodayplanCreationAttributes = Optional<TodayplanAttributes, 'A_Id'>;

export class Today_Plan
    extends Model<TodayplanAttributes, TodayplanCreationAttributes>
    implements TodayplanAttributes {

    declare A_Id: number;
    declare Sch_Id: number | null;
    declare Task_Work_Date: Date | null;
    declare Task_Start_Time: string | null;
    declare Task_End_Time: string | null;
    
    // Extended properties (optional)
    declare Task_Name?: string;
    declare Project_Name?: string;
    declare Sch_No?: string;
}

// Helper function to convert string date to Date object for validation
const parseDateString = (val: any): Date | null => {
    if (!val) return null;
    
    // If it's already a Date object
    if (val instanceof Date) return val;
    
    // If it's a string in YYYY-MM-DD format
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val);
    }
    
    return null;
};

// Zod schemas
export const todayPlanCreateSchema = z.object({
    Sch_Id: z.coerce.number()
        .int()
        .positive('Schedule ID must be positive')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val),
    Task_Work_Date: z.union([
        z.date(),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date must be in YYYY-MM-DD format'),
        z.null()
    ])
    .nullable()
    .optional()
    .transform(val => {
        if (val === undefined || val === null) return null;
        if (val instanceof Date) return val;
        return new Date(val);
    }),
    Task_Start_Time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format (24-hour)')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val),
    Task_End_Time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format (24-hour)')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val)
}).refine(data => {
    // Only validate if both times are provided
    if (data.Task_Start_Time && data.Task_End_Time) {
        return data.Task_End_Time > data.Task_Start_Time;
    }
    return true;
}, {
    message: 'End time must be after start time when both are provided',
    path: ['Task_End_Time']
});

export const todayPlanUpdateSchema = z.object({
    Sch_Id: z.coerce.number()
        .int()
        .positive('Schedule ID must be positive')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val),
    Task_Work_Date: z.union([
        z.date(),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date must be in YYYY-MM-DD format'),
        z.null()
    ])
    .nullable()
    .optional()
    .transform(val => {
        if (val === undefined || val === null) return null;
        if (val instanceof Date) return val;
        return new Date(val);
    }),
    Task_Start_Time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format (24-hour)')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val),
    Task_End_Time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format (24-hour)')
        .nullable()
        .optional()
        .transform(val => val === undefined ? null : val)
}).refine(data => {
    if (data.Task_Start_Time && data.Task_End_Time) {
        return data.Task_End_Time > data.Task_Start_Time;
    }
    return true;
}, {
    message: 'End time must be after start time when both are provided',
    path: ['Task_End_Time']
});

export const todayPlanQuerySchema = z.object({
    schId: z.coerce.number()
        .int()
        .positive('Schedule ID must be positive')
        .nullable()
        .optional(),
    taskWorkDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date must be in YYYY-MM-DD format')
        .nullable()
        .optional(),
    dateFrom: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .nullable()
        .optional(),
    dateTo: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .nullable()
        .optional(),
    startTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format')
        .optional(),
    endTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format')
        .optional(),
    taskId: z.coerce.number()
        .int()
        .positive('Task ID must be positive')
        .nullable()
        .optional(),
    projectId: z.coerce.number()
        .int()
        .positive('Project ID must be positive')
        .nullable()
        .optional(),
    sortBy: z.enum([
        'A_Id',
        'Sch_Id',
        'Task_Work_Date',
        'Task_Start_Time',
        'Task_End_Time',
        'Task_Name',
        'Project_Name'
    ]).default('Task_Work_Date'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
});

export const todayPlanIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid A_Id is required')
});

export type TodayPlanCreateInput = z.infer<typeof todayPlanCreateSchema>;
export type TodayPlanUpdateInput = z.infer<typeof todayPlanUpdateSchema>;
export type TodayPlanQueryParams = z.infer<typeof todayPlanQuerySchema>;

// Initialize the model
Today_Plan.init(
    {
        A_Id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            field: 'A_Id'
        },
        Sch_Id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'Sch_Id'
        },
        Task_Work_Date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'Task_Work_Date'
        },
        Task_Start_Time: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'Task_Start_Time'
        },
        Task_End_Time: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'Task_End_Time'
        }
    },
    {
        sequelize,
        tableName: 'tbl_Project_Sch_Task_DT',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true
    }
);

export const todayPlanAccKey = {
    id: `${modelName}.A_Id`,
    schId: `${modelName}.Sch_Id`,
    taskWorkDate: `${modelName}.Task_Work_Date`,
    taskStartTime: `${modelName}.Task_Start_Time`,
    taskEndTime: `${modelName}.Task_End_Time`
};

// Custom toJSON method
Today_Plan.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

export default Today_Plan;