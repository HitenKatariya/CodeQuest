import users from '../models/auth.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, sendEmailOTP, sendSMSOTP } from '../utils/otp.js';

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

export const signup = async (req, res) => {
    console.log('Signup request received:', { 
        name: req.body.name,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        hasPassword: !!req.body.password
    });
    
    try {
        const { name, email, password, mobileNumber } = req.body;

        // Input validation
        if (!name || !email || !password || !mobileNumber) {
            console.log('Missing fields:', {
                hasName: !!name,
                hasEmail: !!email,
                hasPassword: !!password,
                hasMobile: !!mobileNumber
            });
            return res.status(400).json({ 
                message: "All fields are required",
                success: false,
                details: {
                    name: !name ? 'Name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null,
                    mobileNumber: !mobileNumber ? 'Mobile number is required' : null
                }
            });
        }

        if (!email.includes('@')) {
            return res.status(400).json({ 
                message: "Invalid email format",
                success: false 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters",
                success: false 
            });
        }

        // Check for existing user
        const existingUser = await users.findOne({ 
            $or: [{ email }, { phoneNumber: mobileNumber }] 
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                message: "User with this email or phone number already exists",
                success: false 
            });
        }

        // Generate OTPs
        const emailOTP = generateOTP();
        const mobileOTP = generateOTP();

        // Store OTPs temporarily
        otpStore.set(email, {
            emailOTP,
            mobileOTP,
            userData: {
                name,
                email,
                password,
                mobileNumber
            },
            timestamp: Date.now()
        });

        // Send OTPs
        const emailSent = await sendEmailOTP(email, emailOTP);
        const smsSent = await sendSMSOTP(mobileNumber, mobileOTP);

        if (!emailSent || !smsSent) {
            return res.status(500).json({ 
                message: "Failed to send verification codes",
                success: false 
            });
        }

        res.status(200).json({ 
            message: "Verification codes sent successfully",
            success: true 
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: "Something went wrong",
            success: false 
        });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, emailOtp, mobileOtp } = req.body;
        
        const storedData = otpStore.get(email);
        
        if (!storedData) {
            return res.status(400).json({ 
                message: "OTP expired or not found",
                success: false 
            });
        }

        // Check if OTPs match
        if (storedData.emailOTP !== emailOtp || storedData.mobileOTP !== mobileOtp) {
            return res.status(400).json({ 
                message: "Invalid OTP",
                success: false 
            });
        }

        // Check if OTPs are expired (10 minutes)
        if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
            otpStore.delete(email);
            return res.status(400).json({ 
                message: "OTP expired",
                success: false 
            });
        }

        // Create user
        const { name, password, mobileNumber } = storedData.userData;
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = await users.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber: mobileNumber,
            phoneVerified: true,
            emailVerified: true
        });

        // Generate token
        const token = jwt.sign(
            { email: newUser.email, id: newUser._id },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: "1h" }
        );

        // Clear OTP data
        otpStore.delete(email);

        res.status(201).json({
            result: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                token
            },
            success: true
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            message: "Something went wrong",
            success: false 
        });
    }
};

export const login = async (req, res) => {
    const { email, mobileNumber, password } = req.body;
    try {
        if (!email || !mobileNumber || !password) {
            return res.status(400).json({
                message: "Email, mobile number, and password are required",
                success: false
            });
        }

        const existingUser = await users.findOne({ email, phoneNumber: mobileNumber });
        if (!existingUser) {
            return res.status(404).json({
                message: "User does not exist",
                success: false
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid credentials",
                success: false
            });
        }

        // Send OTP for language switching
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendSMSOTP(mobileNumber, otp);

        const token = jwt.sign({
            email: existingUser.email,
            id: existingUser._id
        }, process.env.JWT_SECRET || 'fallback-secret-key', {
            expiresIn: "1h"
        });

        res.status(200).json({
            result: existingUser,
            token,
            message: "Login successful. OTP sent to your mobile number for language switching.",
            success: true
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};
