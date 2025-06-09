import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from 'url'
import { MongoClient, ServerApiVersion } from 'mongodb'
import userroutes from "./routes/user.js"
import questionroutes from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import avatarRoutes from "./routes/avatar.js"
import postRoutes from "./routes/post.js"
import languageRoutes from "./routes/language.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config({ path: path.resolve(__dirname, '.env') });
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))
// Configure CORS
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'https://code-quest-frontend-sigma.vercel.app',
            'http://localhost:3000',
            'https://code-quest-flame.vercel.app',
            'https://code-quest-frontend.vercel.app'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
}));

// Handle preflight requests
app.options('*', cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await connectToDatabase();
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        res.json({ 
            status: 'ok',
            mongodb: mongoStatus,
            env: process.env.NODE_ENV || 'not set',
            hasMongoUrl: !!process.env.MONGODB_URL
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            mongodb: 'error',
            message: error.message
        });
    }
});

app.post('/debug/echo', (req, res) => {
    console.log('Debug - Headers:', req.headers);
    console.log('Debug - Body:', req.body);
    res.json({
        received: {
            body: req.body,
            contentType: req.headers['content-type']
        }
    });
});

app.use("/user", userroutes);
app.use('/questions', questionroutes);
app.use('/answer', answerroutes);
app.use('/avatar', avatarRoutes);
app.use('/posts', postRoutes);
app.use('/language', languageRoutes);

app.get('/', (req, res) => {
    res.send("Codequest is running perfect")
})

const PORT = process.env.PORT || 3001
const database_url = process.env.MONGODB_URL

// Enhanced MongoDB connection handling for serverless environment
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('=> Using existing database connection');
        return;
    }

    try {
        const mongoOptions = {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URL, mongoOptions);
        isConnected = true;
        console.log('=> Using new database connection');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

// Connect to MongoDB before handling routes
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        res.status(500).json({ 
            message: 'Database connection failed', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Error handling for MongoDB connection issues
mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
    isConnected = false;
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
});

// Connect to MongoDB
connectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error in initial connection:', err);
    });

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    // Return error response
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        success: false,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

console.log('Debug - MONGODB_URL:', process.env.MONGODB_URL);

// Export the Express API for Vercel
export default app;