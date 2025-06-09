import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true,
    timeout: 10000 // 10 second timeout
});

// Add response interceptor for better error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle response errors
        if (error.response) {
            // Server responded with a status code that falls out of the range of 2xx
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            return Promise.reject({ message: 'No response from server' });
        } else {
            // Something happened in setting up the request that triggered an Error
            return Promise.reject({ message: error.message });
        }
    }
);

// Add request interceptor for authentication
API.interceptors.request.use((req) => {
    if (localStorage.getItem("Profile")) {
        req.headers.Authorization = `Bearer ${
            JSON.parse(localStorage.getItem("Profile")).token
        }`;
    }
    return req;
})

export const login = (authdata) => API.post("user/login", authdata);
export const signup = (authdata) => API.post("user/signup", authdata);
export const verifyOtp = (verificationData) => API.post("user/verify-otp", verificationData);
export const getallusers = () => API.get("/user/getallusers");
export const updateprofile = (id, updatedata) => API.patch(`user/update/${id}`, updatedata);

// Friend-related API calls
export const getFriendsList = () => API.get('/user/friends/list');
export const getFriendRequests = () => API.get('/user/friends/requests');
export const sendFriendRequest = (userId) => API.post('/user/friends/request', { receiverId: userId });
export const acceptFriendRequest = (requestId) => API.put(`/user/friends/request/${requestId}/accept`);
export const removeFriend = (friendId) => API.delete(`/user/friends/${friendId}`);

export const postquestion = (questiondata) => API.post("/questions/Ask", questiondata);
export const getallquestions = () => API.get("/questions/get");
export const deletequestion = (id) => API.delete(`/questions/delete/${id}`);
export const votequestion = (id, value) => API.patch(`/questions/vote/${id}`, { value });


export const postanswer = (id, noofanswers, answerbody, useranswered, userid) => API.patch(`/answer/post/${id}`, { noofanswers, answerbody, useranswered, userid });
export const deleteanswer = (id, answerid, noofanswers) => API.patch(`/answer/delete/${id}`, { answerid, noofanswers });

// Posts API calls
export const createPost = (postData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };
    return API.post('/posts/create', postData, config);
};

export const getFeedPosts = () => API.get('/posts/feed');
export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const commentPost = (postId, commentData) => API.post(`/posts/${postId}/comment`, commentData);

// OTP Verification APIs
export const sendEmailVerification = (email, language) => 
    API.post('/language/verify-email', { email, language });

export const sendSMSVerification = (phone, language) => 
    API.post('/language/verify-phone', { phone, language });

export const verifyOTPCode = (code, verificationId, language) => 
    API.post('/language/verify-code', { code, verificationId, language });
