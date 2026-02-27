import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { createProcessMaster, deleteProcessMaster, getAllProcessMaster, getProcessMasterById, updateProcessMaster } from '../../controllers/masters/taskManagement/processMaster.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Process Master
 *   description: Process Master endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessMaster:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Process_Name:
 *           type: string
 *           maxLength: 250
 *           example: "Monthly Reporting Process"
 * 
 *     ProcessMasterCreate:
 *       type: object
 *       required:
 *         - Process_Name
 *       properties:
 *         Process_Name:
 *           type: string
 *           maxLength: 250
 *           example: "Monthly Reporting Process"
 * 
 *     ProcessMasterUpdate:
 *       type: object
 *       required:
 *         - Process_Name
 *       properties:
 *         Process_Name:
 *           type: string
 *           maxLength: 250
 *           example: "Updated Process Name"
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: integer
 *           example: 150
 *         currentPage:
 *           type: integer
 *           example: 1
 *         totalPages:
 *           type: integer
 *           example: 8
 *         pageSize:
 *           type: integer
 *           example: 20
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "Process_Name"
 *               message:
 *                 type: string
 *                 example: "Process Name is required"
 * 
 *   parameters:
 *     processMasterId:
 *       name: id
 *       in: path
 *       description: Process Master ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     paginationPage:
 *       name: page
 *       in: query
 *       description: Page number
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       example: 1
 * 
 *     paginationLimit:
 *       name: limit
 *       in: query
 *       description: Items per page (max 100)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 20
 *       example: 20
 * 
 *     searchQuery:
 *       name: search
 *       in: query
 *       description: Search by process name
 *       required: false
 *       schema:
 *         type: string
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/masters/processMaster:
 *   get:
 *     summary: Get all process masters with pagination and filtering
 *     description: Retrieve a paginated list of process masters with optional search
 *     tags: [Process Master]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - name: sortBy
 *         in: query
 *         description: Sort field
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["Id", "Process_Name"]
 *           default: "Id"
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["ASC", "DESC"]
 *           default: "ASC"
 *     responses:
 *       200:
 *         description: Successfully retrieved process masters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Process masters retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProcessMaster'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllProcessMaster);

/**
 * @swagger
 * /api/masters/processMaster/{id}:
 *   get:
 *     summary: Get Process Master by ID
 *     description: Retrieve a specific Process Master by its ID
 *     tags: [Process Master]
 *     parameters:
 *       - $ref: '#/components/parameters/processMasterId'
 *     responses:
 *       200:
 *         description: Successfully retrieved process master
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Process master retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessMaster'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Process master not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Process master not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getProcessMasterById);

/**
 * @swagger
 * /api/masters/processMaster:
 *   post:
 *     summary: Create a new Process Master
 *     description: Create a new Process Master record
 *     tags: [Process Master]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessMasterCreate'      
 *     responses:
 *       201:
 *         description: Process Master created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Process master created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessMaster'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Process Master already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Process master already exists"
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createProcessMaster
);

/**
 * @swagger
 * /api/masters/processMaster/{id}:
 *   put:
 *     summary: Update a process Master
 *     description: Update an existing process Master by ID
 *     tags: [Process Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/processMasterId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessMasterUpdate'
 *     responses:
 *       200:
 *         description: Process Master updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Process master updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessMaster'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: ProcessMaster not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Process master not found"
 *       409:
 *         description: Conflict - ProcessMaster name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Process master name already exists"
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateProcessMaster
);

/**
 * @swagger
 * /api/masters/processMaster/{id}:
 *   delete:
 *     summary: Delete a ProcessMaster
 *     description: Delete a ProcessMaster permanently
 *     tags: [Process Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/processMasterId'
 *     responses:
 *       200:
 *         description: ProcessMaster deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Process master deleted successfully"
 *       400:
 *         description: Invalid ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Process master not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteProcessMaster
);

export default router;