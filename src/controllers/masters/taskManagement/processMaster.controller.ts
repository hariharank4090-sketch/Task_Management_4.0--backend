import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ZodError } from 'zod';

import {
    processMasterCreateSchema,
    processMasterUpdateSchema,
    processMasterIdSchema,
    processMasterQuerySchema,
    ProcessMasterCreateInput,
    ProcessMasterUpdateInput,
    ProcessMasterQueryParams,
    Process_Master
} from '../../../models/masters/process/type.model';

/* ================= ZOD VALIDATION HELPER ================= */

const validateWithZod = <T>(schema: any, data: any) => {
    try {
        return { success: true, data: schema.parse(data) as T };
    } catch (err) {
        if (err instanceof ZodError) {
            return {
                success: false,
                errors: err.issues.map(e => ({
                    field: e.path.join('.') || 'unknown',
                    message: e.message
                }))
            };
        }
        return { success: false };
    }
};

/* ================= GET ALL ================= */

export const getAllProcessMaster = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<ProcessMasterQueryParams>(
            processMasterQuerySchema,
            req.query
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validation.errors 
            });
        }

        const { 
            page = 1, 
            limit = 20, 
            search, 
            sortBy = 'Id', 
            sortOrder = 'ASC' 
        } = validation.data!;

        const where: any = {};

        // Add search filter if provided
        if (search && search.trim()) {
            where.Process_Name = { 
                [Op.like]: `%${search}%` 
            };
        }

        const offset = (page - 1) * limit;

        const { rows, count } = await Process_Master.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            message: 'Process masters retrieved successfully',
            data: rows,
            pagination: {
                totalRecords: count,
                currentPage: page,
                totalPages,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (e: any) {
        console.error('Get All Error:', e);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= GET BY ID ================= */

export const getProcessMasterById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            processMasterIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        const process = await Process_Master.findByPk(validation.data!.id);
        if (!process) {
            return res.status(404).json({
                success: false,
                message: 'Process not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Process master retrieved successfully',
            data: process
        });

    } catch (e: any) {
        console.error('Get By ID Error:', e);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= CREATE ================= */

export const createProcessMaster = async (req: Request, res: Response) => {
    try {
        console.log('Request Body:', req.body);
        
        const validation = validateWithZod<ProcessMasterCreateInput>(
            processMasterCreateSchema,
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validation.errors 
            });
        }

        const { Process_Name } = validation.data!;

        // Check for duplicate process name
        const exists = await Process_Master.findOne({
            where: {
                Process_Name: Process_Name
            }
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Process name already exists'
            });
        }

        // Create the process - ID will be auto-generated by hook
        const process = await Process_Master.create({
            Process_Name: Process_Name,
            Id: 0
        });

        return res.status(201).json({
            success: true,
            message: 'Process created successfully',
            data: process
        });

    } catch (e: any) {
        console.error('Create Error Details:', {
            name: e.name,
            message: e.message,
            parent: e.parent?.message,
            sql: e.sql,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
        
        // Handle specific database errors
        if (e.name === 'SequelizeDatabaseError') {
            if (e.parent && e.parent.number === 515) { // Cannot insert NULL error
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ID column issue. Please ensure table has proper IDENTITY setup.',
                    suggestion: 'Contact database administrator to run: ALTER TABLE tbl_Process_Master ALTER COLUMN Id BIGINT IDENTITY(1,1) NOT NULL'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        // Handle validation errors
        if (e.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: e.errors.map((err: any) => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= UPDATE ================= */

export const updateProcessMaster = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(
            processMasterIdSchema,
            req.params
        );

        if (!idValidation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        // Validate request body
        const bodyValidation = validateWithZod<ProcessMasterUpdateInput>(
            processMasterUpdateSchema,
            req.body
        );

        if (!bodyValidation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: bodyValidation.errors 
            });
        }

        // Find the process
        const process = await Process_Master.findByPk(idValidation.data!.id);
        if (!process) {
            return res.status(404).json({
                success: false,
                message: 'Process not found'
            });
        }

        // Check for duplicate name (excluding current record)
        if (bodyValidation.data!.Process_Name) {
            const duplicate = await Process_Master.findOne({
                where: {
                    Process_Name: bodyValidation.data!.Process_Name,
                    Id: { [Op.ne]: process.Id }
                }
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Process name already exists'
                });
            }
        }

        // Update the process
        await process.update({
            Process_Name: bodyValidation.data!.Process_Name
        });
        
        // Fetch updated record
        const updatedProcess = await Process_Master.findByPk(process.Id);

        return res.status(200).json({
            success: true,
            message: 'Process updated successfully',
            data: updatedProcess
        });

    } catch (e: any) {
        console.error('Update Error:', e);
        
        if (e.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= DELETE ================= */

export const deleteProcessMaster = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            processMasterIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        const process = await Process_Master.findByPk(validation.data!.id);
        if (!process) {
            return res.status(404).json({
                success: false,
                message: 'Process not found'
            });
        }

        // Hard delete (permanent removal)
        await process.destroy();
        
        return res.status(200).json({
            success: true,
            message: 'Process deleted successfully'
        });

    } catch (e: any) {
        console.error('Delete Error:', e);
        
        if (e.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};