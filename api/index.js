import express from 'express';
import apiRouter from '../src/server/routes/api.js';

const app = express();
app.use(express.json());

// Mount router
app.use('/api', apiRouter);

export default app;
