import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db.ts';
import routes from './routes.ts';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from client/public directory
// Serve static files from client/public directory
const isProduction = process.env.NODE_ENV === 'production';
const publicPath = isProduction
    ? path.join(__dirname, 'public')
    : path.join(__dirname, '../client/public');
app.use(express.static(publicPath));

// Serve static files from client/src directory for development
const srcPath = path.join(__dirname, '../client/src');
app.use('/src', express.static(srcPath));

// API routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Serve favicon.ico specifically
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(publicPath, 'favicon.ico'));
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();

        // Start the server
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Database initialized and ready');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
startServer();
