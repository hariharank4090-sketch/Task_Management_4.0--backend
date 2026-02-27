import express from 'express';
import {
    getAllTodayPlans,
    getTodayPlanById,
    getTodayPlansBySchedule,
    getTodayPlansByDateRange,
    getTodayPlansByDate,
    getTodayPlansByTask,
    getTodayPlansByProject,
    getTodayPlansSummary
} from '../../controllers/Today plan/Todayplan.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TodayPlans
 *   description: Today Plan management endpoints (Read-Only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TodayPlan:
 *       type: object
 *       properties:
 *         A_Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Sch_Id:
 *           type: integer
 *           nullable: true
 *           example: 100
 *         Task_Work_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Date in YYYY-MM-DD format
 *           example: "2024-03-15"
 *         Task_Start_Time:
 *           type: string
 *           nullable: true
 *           description: Time in HH:MM format (24-hour)
 *           example: "09:00"
 *         Task_End_Time:
 *           type: string
 *           nullable: true
 *           description: Time in HH:MM format (24-hour)
 *           example: "17:00"
 *         Sch_No:
 *           type: string
 *           description: Schedule number
 *           example: "SCH-2024-001"
 *         Task_Id:
 *           type: integer
 *           description: Task ID
 *           example: 5
 *         Task_Name:
 *           type: string
 *           description: Task name
 *           example: "Site Inspection"
 *         Project_Id:
 *           type: integer
 *           description: Project ID
 *           example: 2
 *         Project_Name:
 *           type: string
 *           description: Project name
 *           example: "Metro Phase 3"
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
 *                 example: "Task_Start_Time"
 *               message:
 *                 type: string
 *                 example: "Start time must be in HH:MM format"
 * 
 *   parameters:
 *     todayPlanId:
 *       name: id
 *       in: path
 *       description: Today Plan A_Id
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     scheduleId:
 *       name: schId
 *       in: path
 *       description: Schedule ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 100
 * 
 *     taskId:
 *       name: taskId
 *       in: path
 *       description: Task ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 5
 * 
 *     projectId:
 *       name: projectId
 *       in: path
 *       description: Project ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 2
 * 
 *     dateParam:
 *       name: date
 *       in: path
 *       description: Date in YYYY-MM-DD format
 *       required: true
 *       schema:
 *         type: string
 *         pattern: '^\d{4}-\d{2}-\d{2}$'
 *       example: "2024-03-15"
 */

// Main endpoint with filters - defaults to current date if no date filters provided
/**
 * @swagger
 * /api/todayPlan/todayPlan:
 *   get:
 *     summary: Get all today plans (defaults to current date)
 *     description: Retrieve all today plans with optional filtering. If no date filters provided, returns records for current date.
 *     tags: [TodayPlans]
 *     parameters:
 *       - name: schId
 *         in: query
 *         description: Filter by schedule ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: taskId
 *         in: query
 *         description: Filter by task ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: projectId
 *         in: query
 *         description: Filter by project ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: taskWorkDate
 *         in: query
 *         description: Filter by specific work date (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateFrom
 *         in: query
 *         description: Start date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         description: End date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: startTime
 *         in: query
 *         description: Filter by start time (HH:MM)
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *       - name: endTime
 *         in: query
 *         description: Filter by end time (HH:MM)
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           enum: [A_Id, Sch_Id, Task_Work_Date, Task_Start_Time, Task_End_Time, Task_Name, Project_Name]
 *           default: Task_Work_Date
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *                 total:
 *                   type: integer
 *                   description: Total number of records
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllTodayPlans);

// Get summary
/**
 * @swagger
 * /api/todayPlan/todayPlan/summary:
 *   get:
 *     summary: Get today plans summary
 *     description: Get summary statistics for today plans (defaults to current date)
 *     tags: [TodayPlans]
 *     parameters:
 *       - name: date
 *         in: query
 *         description: Date for summary (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved summary
 *       500:
 *         description: Internal server error
 */
router.get('/summary', getTodayPlansSummary);

// By schedule
/**
 * @swagger
 * /api/todayPlan/todayPlan/schedule/{schId}:
 *   get:
 *     summary: Get today plans by schedule ID
 *     description: Retrieve all today plans for a specific schedule
 *     tags: [TodayPlans]
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans by schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid schedule ID
 *       500:
 *         description: Internal server error
 */
router.get('/schedule/:schId', getTodayPlansBySchedule);

// By task
/**
 * @swagger
 * /api/todayPlan/todayPlan/task/{taskId}:
 *   get:
 *     summary: Get today plans by task ID (defaults to current date)
 *     description: Retrieve all today plans for a specific task
 *     tags: [TodayPlans]
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *       - name: dateFrom
 *         in: query
 *         description: Start date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         description: End date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans by task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid task ID
 *       500:
 *         description: Internal server error
 */
router.get('/task/:taskId', getTodayPlansByTask);

// By project
/**
 * @swagger
 * /api/todayPlan/todayPlan/project/{projectId}:
 *   get:
 *     summary: Get today plans by project ID (defaults to current date)
 *     description: Retrieve all today plans for a specific project
 *     tags: [TodayPlans]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - name: dateFrom
 *         in: query
 *         description: Start date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         description: End date for range filter (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans by project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid project ID
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', getTodayPlansByProject);

// By date range
/**
 * @swagger
 * /api/todayPlan/todayPlan/date-range:
 *   get:
 *     summary: Get today plans by date range
 *     description: Retrieve today plans within a specific date range
 *     tags: [TodayPlans]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Start date (YYYY-MM-DD)
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: End date (YYYY-MM-DD)
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans by date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid date parameters
 *       500:
 *         description: Internal server error
 */
router.get('/date-range', getTodayPlansByDateRange);

// By specific date
/**
 * @swagger
 * /api/todayPlan/todayPlan/date/{date}:
 *   get:
 *     summary: Get today plans by specific date
 *     description: Retrieve all today plans for a specific date
 *     tags: [TodayPlans]
 *     parameters:
 *       - $ref: '#/components/parameters/dateParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved today plans by date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid date
 *       500:
 *         description: Internal server error
 */
router.get('/date/:date', getTodayPlansByDate);

// By ID
/**
 * @swagger
 * /api/todayPlan/todayPlan/{id}:
 *   get:
 *     summary: Get today plan by ID
 *     description: Retrieve a specific today plan by its A_Id
 *     tags: [TodayPlans]
 *     parameters:
 *       - $ref: '#/components/parameters/todayPlanId'
 *     responses:
 *       200:
 *         description: Successfully retrieved today plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TodayPlan'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Today plan not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getTodayPlanById);

export default router;