import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import icon from '../../assets/icon.png';
import { signup, login } from '../../action/auth';

const Auth = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (isSignup && (!name || !email || !mobileNumber || !password)) {
            setError('All fields are required for signup');
            setIsLoading(false);
            return;
        }

        if (!isSignup && (!email || !password)) {
            setError('Email and password are required for login');
            setIsLoading(false);
            return;
        }

        const result = isSignup
            ? await dispatch(signup({ name, email, mobileNumber, password }, navigate))
            : await dispatch(login({ email, mobileNumber, password }, navigate));

        setIsLoading(false);
        if (!result.success) {
            setError(result.error);
        }
    };

    const handleSwitch = () => {
        setIsSignup(!isSignup);
        setName('');
        setEmail('');
        setMobileNumber('');
        setPassword('');
        setError('');
    };

    return (
        <section className='auth-section'>
            <div className='auth-container'>
                <img src={icon} alt='Code Quest' className='auth-logo' />
                <h2>{isSignup ? 'Create Your Account' : 'Welcome Back!'}</h2>
                <p>{isSignup ? 'Join CodeQuest and start your coding journey.' : 'Log in to continue your coding adventure.'}</p>
                <form onSubmit={handleSubmit} className='auth-form'>
                    {isSignup && (
                        <label htmlFor="name">
                            <h4>Display Name</h4>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your display name"
                            />
                        </label>
                    )}
                    <label htmlFor="email">
                        <h4>Email</h4>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </label>
                    {isSignup && (
                        <label htmlFor="mobile">
                            <h4>Mobile Number</h4>
                            <input
                                type="tel"
                                id="mobile"
                                name="mobile"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="Enter your mobile number"
                            />
                        </label>
                    )}
                    <label htmlFor="password">
                        <h4>Password</h4>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </label>
                    {error && <p className='error-message'>{error}</p>}
                    <button type='submit' className='auth-btn' disabled={isLoading}>
                        {isLoading ? (isSignup ? 'Creating Account...' : 'Logging in...') : isSignup ? 'Sign up' : 'Log in'}
                    </button>
                </form>
                <p>
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    <button type='button' className='handle-switch-btn' onClick={handleSwitch}>
                        {isSignup ? 'Log in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </section>
    );
};

export default Auth;