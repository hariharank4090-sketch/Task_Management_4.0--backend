import express from 'express';

import todayplanRoutes from './todayplan.route';


const router = express.Router();


router.use('/todayPlan', todayplanRoutes)



export default router;