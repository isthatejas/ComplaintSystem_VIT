import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, arrayUnion, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyB82KNkYF7YvQKnXs1tx38rzcIJPN3x8LU",
  authDomain: "vit-hostel-complaint-new.firebaseapp.com",
  projectId: "vit-hostel-complaint-new",
  storageBucket: "vit-hostel-complaint-new.firebasestorage.app",
  messagingSenderId: "76683307577",
  appId: "1:76683307577:web:b8f76b79c1d4247b4fbbe8",
  measurementId: "G-Q1B54YBRKD"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Admin Emails ---
const ADMIN_EMAILS = ["tejassharma0102@gmail.com", "suchetsanjeev.patil@gmail.com"];

// --- Global Constants ---
const blockOptions = ['all', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T'];
const categoryOptions = ['all', 'Wi-fi Related Complaints', 'Carpenter Related Complaints', 'AC Related Complaints', 'Plumber Related Complaints', 'Electrician Related Complaints', 'Mess Related Complaints'];

// --- Gemini API Helper ---
const callGeminiAPI = async (prompt) => {
    const apiKey = "AIzaSyDgNfRNtmk8PiRsTkZO8t3BKYVwwt_qNjc"; // API Key updated
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error Response:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Gemini API response structure unexpected:", result);
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                 throw new Error(`Request blocked: ${result.promptFeedback.blockReason}`);
            }
            return "Could not generate a response. Please try again.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return `Error: ${error.message}`;
    }
};


// --- SVG Icons ---
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>);
const DashboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const NewComplaintIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const SparkleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v2.586l1.707-1.707a1 1 0 111.414 1.414L12.414 8H15a1 1 0 110 2h-2.586l1.707 1.707a1 1 0 11-1.414 1.414L11 11.414V14a1 1 0 11-2 0v-2.586l-1.707 1.707a1 1 0 11-1.414-1.414L7.586 10H5a1 1 0 110-2h2.586L5.879 6.293a1 1 0 111.414-1.414L9 6.586V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const ReportsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>);
const StarIcon = ({ filled, onClick }) => (<svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
const SunIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>);
const MoonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>);

// --- Theme Toggle Component ---
const ThemeToggle = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // IMPORTANT: For Tailwind dark mode to work in a local setup, 
        // your tailwind.config.js must have darkMode set to 'class'.
        // e.g., module.exports = { darkMode: 'class', ... }
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-800 dark:text-gray-200">Loading...</p>
            </div>
        );
    }

    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    const isVerified = user && user.emailVerified;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            {!user ? (
                <AuthScreen theme={theme} setTheme={setTheme} />
            ) : isAdmin ? (
                <AdminDashboard user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
            ) : !isVerified ? (
                <VerifyEmailScreen user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
            ) : (
                <StudentDashboard user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
            )}
        </div>
    );
}

// --- Authentication Screen Component ---
function AuthScreen({ theme, setTheme }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [authView, setAuthView] = useState('login'); // 'login', 'register', 'reset'
    const [error, setError] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const validateRegistration = () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return false;
        }
        const regNoRegex = /^\d{2}[A-Z]{3}\d{4}$/;
        if (!regNoRegex.test(regNo)) {
            setError("Invalid Registration Number format. Example: 22BCE3947");
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateRegistration()) return;
        try {
            if (ADMIN_EMAILS.includes(email)) {
                setError("Registration is not allowed for this email address.");
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            await setDoc(doc(db, "users", user.uid), { name, regNo, email: user.email });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (authView === 'register') {
            handleRegister();
        } else {
            handleLogin();
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage('Password reset link sent! Please check your email.');
        } catch (err) {
            setError(err.message);
        }
    };

    const switchView = (view) => {
        setAuthView(view);
        setError('');
        setResetMessage('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-md m-4">
                <div className="flex flex-col items-center space-y-4">
                    <img src="https://i.pinimg.com/736x/c6/c2/e9/c6c2e9022f25f404fe108a4cfefab222.jpg" alt="VIT Vellore Logo" className="h-48 w-auto" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x80?text=VIT+Logo'; }}/>
                    <h2 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-200">
                        {authView === 'login' && "Login to Your Account"}
                        {authView === 'register' && "Create a New Account"}
                        {authView === 'reset' && "Reset Your Password"}
                    </h2>
                    {authView !== 'reset' && <p className="text-center text-gray-500 dark:text-gray-400">VIT Men's Hostel Complaint System</p>}
                </div>
                
                {authView === 'reset' ? (
                    <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-300">Enter your email address and we will send you a link to reset your password.</p>
                        <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="your.email@vitstudent.ac.in" required /></div>
                        {error && <p className="text-red-500 text-sm text-center">{error.replace('Firebase: ', '')}</p>}
                        {resetMessage && <p className="text-green-600 text-sm text-center">{resetMessage}</p>}
                        <button type="submit" className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Send Reset Link</button>
                        <p className="text-sm text-center"><button type="button" onClick={() => switchView('login')} className="font-medium text-blue-600 hover:underline dark:text-blue-500">Back to Login</button></p>
                    </form>
                ) : (
                    <>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {authView === 'register' && (
                            <>
                                <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="John Doe" required /></div>
                                <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Registration Number</label><input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value.toUpperCase())} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="22BCE3947" required /></div>
                            </>
                        )}
                        <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="your.email@vitstudent.ac.in" required /></div>
                        <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="••••••••" required /></div>
                        {authView === 'register' && <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="••••••••" required /></div>}
                        {authView === 'login' && <div className="text-right"><button type="button" onClick={() => switchView('reset')} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">Forgot Password?</button></div>}
                        {error && <p className="text-red-500 text-sm text-center">{error.replace('Firebase: ', '')}</p>}
                        <button type="submit" className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">{authView === 'register' ? 'Register' : 'Login'}</button>
                    </form>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                        {authView === 'register' ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => switchView(authView === 'register' ? 'login' : 'register')} className="ml-1 font-medium text-blue-600 hover:underline dark:text-blue-500">{authView === 'register' ? 'Login' : 'Register'}</button>
                    </p>
                    </>
                )}
            </div>
        </div>
    );
}

// --- Verify Email Screen ---
function VerifyEmailScreen({ user, onLogout, theme, setTheme }) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
            }
        }, 3000); 

        return () => clearInterval(interval);
    }, []);

    const handleResendVerification = async () => {
        try {
            await sendEmailVerification(user);
            setMessage('A new verification email has been sent. Please check your inbox (and spam folder).');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
             <div className="absolute top-4 right-4 z-10">
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-md m-4 text-center">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Verify Your Email</h2>
                <p className="text-gray-500 dark:text-gray-400">A verification link has been sent to <strong>{user.email}</strong>. Please click the link to activate your account.</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Once verified, please click the button below to log in.</p>
                <div className="space-y-4 pt-4">
                    <button onClick={onLogout} className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Proceed to Login</button>
                    <button onClick={handleResendVerification} className="w-full py-2.5 px-4 font-semibold text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Resend Verification Email</button>
                </div>
                {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
            </div>
        </div>
    );
}


// --- Student Dashboard Component ---
function StudentDashboard({ user, onLogout, theme, setTheme }) {
    const [complaints, setComplaints] = useState([]);
    const [studentProfile, setStudentProfile] = useState(null);
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, complaintId: null });

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) setStudentProfile(doc.data());
            });

            const q = query(collection(db, "complaints"), where("userId", "==", user.uid));
            const unsubscribeComplaints = onSnapshot(q, (querySnapshot) => {
                const userComplaints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                userComplaints.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
                setComplaints(userComplaints);
            });

            return () => {
                unsubscribeProfile();
                unsubscribeComplaints();
            };
        }
    }, [user]);
    
    const handleDeleteComplaint = async (id) => {
        await deleteDoc(doc(db, "complaints", id));
    };

    const handleFeedbackSubmit = async (complaintId, rating, review) => {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, {
            feedback: {
                rating,
                review,
                submittedAt: new Date()
            },
            feedbackSubmitted: true
        });
        setFeedbackModal({ isOpen: false, complaintId: null });
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {feedbackModal.isOpen && <FeedbackModal complaintId={feedbackModal.complaintId} onSubmit={handleFeedbackSubmit} onClose={() => setFeedbackModal({ isOpen: false, complaintId: null })} />}
            <Sidebar onLogout={onLogout} setView={setView} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} isAdmin={false} profile={studentProfile} />
            <div className="flex-1 flex flex-col overflow-hidden">
                 <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex-shrink-0 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Student Portal</h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden"><MenuIcon /></button>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {view === 'dashboard' && <DashboardView complaints={complaints} setView={setView} onDelete={handleDeleteComplaint} onOpenFeedback={(id) => setFeedbackModal({ isOpen: true, complaintId: id })} />}
                    {view === 'form' && <ComplaintForm user={user} setView={setView} profile={studentProfile} />}
                </main>
            </div>
        </div>
    );
}

// --- Admin Dashboard Component ---
function AdminDashboard({ user, onLogout, theme, setTheme }) {
    const [allComplaints, setAllComplaints] = useState([]);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'reports'
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    useEffect(() => {
        const q = query(collection(db, "complaints"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const complaintsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            complaintsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setAllComplaints(complaintsData);
        }, (error) => console.error("Error fetching all complaints (Admin): ", error));
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar onLogout={onLogout} setView={setView} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} isAdmin={true} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex-shrink-0 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Admin Portal</h1>
                     <div className="flex items-center gap-4">
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden"><MenuIcon /></button>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {view === 'dashboard' && <AdminDashboardView complaints={allComplaints} />}
                    {view === 'reports' && <ReportsView complaints={allComplaints} />}
                </main>
            </div>
        </div>
    );
}


// --- Admin Dashboard View ---
function AdminDashboardView({ complaints }) {
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [filters, setFilters] = useState({ category: '', block: '', status: '', search: '' });
    const [modalState, setModalState] = useState({ isOpen: false, content: '', title: '' });
    const statusOptions = ['all', 'Submitted', 'In Progress', 'Resolved'];

    useEffect(() => {
        setFilteredComplaints(complaints);
    }, [complaints]);

    useEffect(() => {
        let result = complaints;
        if (filters.category && filters.category !== 'all') result = result.filter(c => c.category === filters.category);
        if (filters.block && filters.block !== 'all') result = result.filter(c => c.block === filters.block);
        if (filters.status && filters.status !== 'all') result = result.filter(c => c.status === filters.status);
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(searchTerm) ||
                c.regNo?.toLowerCase().includes(searchTerm) ||
                c.subject?.toLowerCase().includes(searchTerm) ||
                c.description?.toLowerCase().includes(searchTerm)
            );
        }
        setFilteredComplaints(result);
    }, [filters, complaints]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleStatusChange = async (id, newStatus) => await updateDoc(doc(db, "complaints", id), { status: newStatus });
    const handleAddNote = async (id, note) => {
        if (note.trim()) await updateDoc(doc(db, "complaints", id), { notes: arrayUnion({ text: note, author: "Admin", createdAt: new Date() }) });
    };
    const handleDeleteComplaint = async (id) => await deleteDoc(doc(db, "complaints", id));

    return (
        <>
            <GeminiModal {...modalState} onClose={() => setModalState({ isOpen: false, content: '', title: '' })} />
            <AdminStats complaints={complaints} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 my-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><CategoryChart complaints={complaints} /></div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><BlockChart complaints={complaints} /></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <input type="text" name="search" placeholder="Search..." value={filters.search} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <option value="" disabled>Filter by Category</option>
                        {categoryOptions.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                    </select>
                    <select name="block" value={filters.block} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <option value="" disabled>Filter by Block</option>
                        {blockOptions.map(b => <option key={b} value={b}>{b === 'all' ? 'All Blocks' : b}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <option value="" disabled>Filter by Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                {filteredComplaints.map(c => <AdminComplaintCard key={c.id} complaint={c} onStatusChange={handleStatusChange} onAddNote={handleAddNote} onDelete={handleDeleteComplaint} setModalState={setModalState} />)}
                {filteredComplaints.length === 0 && <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600"><p className="text-gray-500 dark:text-gray-400 text-lg">No complaints match the current filters.</p></div>}
            </div>
        </>
    );
}

// --- Reports View Component ---
function ReportsView({ complaints }) {
    const feedbackComplaints = complaints.filter(c => c.feedbackSubmitted);

    const avgRating = feedbackComplaints.reduce((acc, c) => acc + c.feedback.rating, 0) / (feedbackComplaints.length || 1);

    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
        name: `${star} Star`,
        count: feedbackComplaints.filter(c => c.feedback.rating === star).length
    }));
    
    const categoryRatings = categoryOptions.slice(1).map(cat => {
        const relevantComplaints = feedbackComplaints.filter(c => c.category === cat);
        const avg = relevantComplaints.reduce((acc, c) => acc + c.feedback.rating, 0) / (relevantComplaints.length || 1);
        return { name: cat.split(" ")[0], "Average Rating": avg.toFixed(2) };
    }).filter(item => item["Average Rating"] > 0);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Feedback Reports</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">Total Feedback</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feedbackComplaints.length}</p></div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{avgRating.toFixed(2)} / 5</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Rating Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={ratingDistribution}><XAxis dataKey="name" fontSize={12} tick={{ fill: '#a0aec0' }} /><YAxis allowDecimals={false} tick={{ fill: '#a0aec0' }} /><Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} /><Bar dataKey="count" fill="#8884d8" /></BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Average Rating by Category</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={categoryRatings}><XAxis dataKey="name" fontSize={12} tick={{ fill: '#a0aec0' }} /><YAxis domain={[0, 5]} tick={{ fill: '#a0aec0' }} /><Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} /><Bar dataKey="Average Rating" fill="#82ca9d" /></BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Feedback</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700"><tr><th scope="col" className="px-6 py-3">Student</th><th scope="col" className="px-6 py-3">Complaint</th><th scope="col" className="px-6 py-3">Rating</th><th scope="col" className="px-6 py-3">Review</th></tr></thead>
                        <tbody>
                            {feedbackComplaints.map(c => (
                                <tr key={c.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="px-6 py-4">{c.name} ({c.regNo})</td>
                                    <td className="px-6 py-4">{c.subject}</td>
                                    <td className="px-6 py-4">{c.feedback.rating} / 5</td>
                                    <td className="px-6 py-4 max-w-sm truncate">{c.feedback.review}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


// --- Admin Stats Component ---
function AdminStats({ complaints }) {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Submitted').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">Total Complaints</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</p></div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">Pending</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{pending}</p></div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgress}</p></div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{resolved}</p></div>
        </div>
    );
}

// --- Chart Components ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

function CategoryChart({ complaints }) {
    const data = categoryOptions.slice(1).map(category => ({
        name: category.split(' ')[0],
        value: complaints.filter(c => c.category === category).length
    })).filter(item => item.value > 0);

    return (
        <>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={{ fill: '#fff' }}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                </PieChart>
            </ResponsiveContainer>
        </>
    );
}

function BlockChart({ complaints }) {
    const data = blockOptions.slice(1).map(block => ({
        name: `Block ${block}`,
        complaints: complaints.filter(c => c.block === block).length
    }));

    return (
        <>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Complaints by Block</h3>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: '#a0aec0' }} />
                    <YAxis tick={{ fill: '#a0aec0' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                    <Bar dataKey="complaints" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </>
    );
}

// --- Gemini Modal Component ---
function GeminiModal({ isOpen, onClose, title, content }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                </div>
                <div className="p-4 whitespace-pre-wrap text-gray-600 dark:text-gray-300 text-sm max-h-96 overflow-y-auto">
                    {content}
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Close</button>
                </div>
            </div>
        </div>
    );
}


// --- Admin Complaint Card ---
function AdminComplaintCard({ complaint, onStatusChange, onAddNote, onDelete, setModalState }) {
    const [note, setNote] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isLoading, setIsLoading] = useState({ summarize: false, draft: false });

    const handleNoteSubmit = (e) => {
        e.preventDefault();
        onAddNote(complaint.id, note);
        setNote('');
    };
    
    const handleDeleteClick = () => {
        if (confirmDelete) {
            onDelete(complaint.id);
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    };

    const handleSummarize = async () => {
        setIsLoading(prev => ({ ...prev, summarize: true }));
        const prompt = `Summarize the following student hostel complaint in 2-3 sentences:\n\nCategory: ${complaint.category}\nSubject: ${complaint.subject}\nDescription: ${complaint.description}`;
        const summary = await callGeminiAPI(prompt);
        setModalState({ isOpen: true, title: "Complaint Summary", content: summary });
        setIsLoading(prev => ({ ...prev, summarize: false }));
    };

    const handleDraftNote = async () => {
        setIsLoading(prev => ({ ...prev, draft: true }));
        const prompt = `You are a helpful hostel admin. A student filed the following complaint:\n\nCategory: ${complaint.category}\nSubject: ${complaint.subject}\nDescription: ${complaint.description}\n\nDraft a polite and professional initial response to add as a note, acknowledging the complaint and assuring them it's being looked into.`;
        const draft = await callGeminiAPI(prompt);
        setNote(draft);
        setShowNotes(true);
        setIsLoading(prev => ({ ...prev, draft: false }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">{complaint.subject}</h3><span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${ complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' : complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800' }`}>{complaint.status}</span></div>
                    <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-3">{complaint.category}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{complaint.description}</p>
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1"><p><strong>Student:</strong> {complaint.name} ({complaint.regNo})</p><p><strong>Location:</strong> Room {complaint.roomNumber}, Block {complaint.block}</p><p><strong>Contact:</strong> {complaint.phone}</p><p><strong>Submitted:</strong> {new Date(complaint.createdAt?.toDate()).toLocaleString()}</p></div>
                </div>
                <div className="md:col-span-1 flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-4">
                    <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Update Status</label><select value={complaint.status} onChange={(e) => onStatusChange(complaint.id, e.target.value)} className="w-full max-w-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="Submitted">Submitted</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option></select></div>
                    <div className="flex flex-col items-start md:items-end gap-2 mt-4">
                        <button onClick={handleSummarize} disabled={isLoading.summarize} className="flex items-center justify-center text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-3 py-1 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-wait">
                           <SparkleIcon /> {isLoading.summarize ? 'Summarizing...' : 'Summarize'}
                        </button>
                        <button onClick={() => setShowNotes(!showNotes)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline"> {showNotes ? 'Hide' : 'Show/Add'} Notes ({complaint.notes?.length || 0})</button>
                        <button onClick={handleDeleteClick} className={`text-sm ${confirmDelete ? 'text-red-700 font-bold' : 'text-red-500'} hover:underline`}>{confirmDelete ? 'Confirm?' : 'Delete'}</button>
                    </div>
                </div>
            </div>
            {showNotes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-sm mb-2">Notes</h4>
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">{complaint.notes?.map((n, i) => (<div key={i} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm"><p className="text-gray-700 dark:text-gray-300">{n.text}</p><p className="text-xs text-gray-500 dark:text-gray-400 text-right"> - {n.author} on {new Date(n.createdAt?.toDate()).toLocaleDateString()}</p></div>))}{!complaint.notes?.length && <p className="text-xs text-gray-500 dark:text-gray-400">No notes yet.</p>}</div>
                    <form onSubmit={handleNoteSubmit} className="flex items-center gap-2">
                        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a new note..." className="flex-grow px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button type="button" onClick={handleDraftNote} disabled={isLoading.draft} className="p-1.5 text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 disabled:opacity-50 disabled:cursor-wait" title="Draft Note with AI"><SparkleIcon /></button>
                        <button type="submit" className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add</button>
                    </form>
                </div>
            )}
        </div>
    );
}

// --- Sidebar Component ---
function Sidebar({ onLogout, setView, isSidebarOpen, setSidebarOpen, isAdmin, profile }) {
    const handleNavigation = (viewName) => {
        setView(viewName);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
            <div className={`w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-between fixed md:relative inset-y-0 left-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div>
                    <div className="flex items-center justify-center p-4 border-b dark:border-gray-700"><img src="https://i.pinimg.com/736x/c6/c2/e9/c6c2e9022f25f404fe108a4cfefab222.jpg" alt="VIT Logo" className="h-24" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x40?text=VIT+Logo'; }}/></div>
                    <div className="p-4 border-b dark:border-gray-700"><p className="text-center text-sm text-gray-500 dark:text-gray-400">Welcome,</p><p className="text-center font-semibold text-blue-700 dark:text-blue-400 truncate">{isAdmin ? 'Admin' : (profile?.name || 'Student')}</p>{!isAdmin && <p className="text-center text-xs text-gray-500 dark:text-gray-400">{profile?.regNo}</p>}</div>
                    <nav className="mt-4">
                        <ul>
                            {isAdmin ? (<>
                                <li className="px-4 mb-2"><button onClick={() => handleNavigation('dashboard')} className="w-full flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition"><DashboardIcon /> Dashboard</button></li>
                                <li className="px-4 mb-2"><button onClick={() => handleNavigation('reports')} className="w-full flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition"><ReportsIcon /> Reports</button></li>
                                </>
                            ) : (<>
                                <li className="px-4 mb-2"><button onClick={() => handleNavigation('dashboard')} className="w-full flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition"><DashboardIcon /> Dashboard</button></li>
                                <li className="px-4 mb-2"><button onClick={() => handleNavigation('form')} className="w-full flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition"><NewComplaintIcon /> New Complaint</button></li></>
                            )}
                        </ul>
                    </nav>
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
                    <button onClick={onLogout} className="flex-grow py-2 px-4 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300">Logout</button>
                </div>
            </div>
        </>
    );
}

// --- Student Dashboard View ---
function DashboardView({ complaints, setView, onDelete, onOpenFeedback }) {
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleDeleteClick = (id) => {
        if (confirmDeleteId === id) {
            onDelete(id);
            setConfirmDeleteId(null);
        } else {
            setConfirmDeleteId(id);
            setTimeout(() => setConfirmDeleteId(null), 3000);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Your Complaints</h2><button onClick={() => setView('form')} className="hidden sm:block px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300">+ New Complaint</button></div>
            {complaints.length === 0 ? (<div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600"><p className="text-gray-500 dark:text-gray-400 text-lg">You haven't submitted any complaints yet.</p><button onClick={() => setView('form')} className="mt-4 px-5 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">File Your First Complaint</button></div>) : (
                <div className="space-y-4">
                    {complaints.map(c => (
                        <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">{c.subject}</h3><span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${ c.status === 'Resolved' ? 'bg-green-100 text-green-800' : c.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800' }`}>{c.status}</span></div>
                            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-3">{c.category}</p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{c.description}</p>
                            {c.status === 'Resolved' && !c.feedbackSubmitted && <div className="my-4 text-center"><button onClick={() => onOpenFeedback(c.id)} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Leave Feedback</button></div>}
                            {c.feedbackSubmitted && <div className="my-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 text-sm"><p className="font-semibold text-blue-800 dark:text-blue-300">Your Feedback:</p><div className="flex items-center my-1">{[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < c.feedback.rating} />)}</div><p className="text-blue-700 dark:text-blue-400">"{c.feedback.review}"</p></div>}
                            {c.notes && c.notes.length > 0 && (<div className="my-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"><h4 className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">Admin Notes:</h4><div className="space-y-2">{c.notes.map((n, i) => (<div key={i} className="text-xs text-gray-500 dark:text-gray-400"><p className="text-gray-700 dark:text-gray-300 text-sm">"{n.text}"</p><p className="text-right">- {new Date(n.createdAt?.toDate()).toLocaleDateString()}</p></div>))}</div></div>)}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400"><span>Room {c.roomNumber}, Block {c.block}</span><div className="flex items-center gap-4"><span>{new Date(c.createdAt?.toDate()).toLocaleString()}</span><button onClick={() => handleDeleteClick(c.id)} className={`flex items-center text-xs ${confirmDeleteId === c.id ? 'text-red-700 font-bold' : 'text-red-500'} hover:underline`}><DeleteIcon /> {confirmDeleteId === c.id ? 'Confirm?' : 'Delete'}</button></div></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Feedback Modal Component ---
function FeedbackModal({ complaintId, onSubmit, onClose }) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating > 0) {
            onSubmit(complaintId, rating, review);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Provide Feedback</h3></div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">How would you rate the service?</label>
                            <div className="flex items-center justify-center">{[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < rating} onClick={() => setRating(i + 1)} />)}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Comments (optional)</label>
                            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows="3" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" />
                        </div>
                    </div>
                    <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={rating === 0}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Complaint Form Component ---
function ComplaintForm({ user, setView, profile }) {
    const [formData, setFormData] = useState({ name: '', regNo: '', block: 'A', roomNumber: '', phone: '', countryCode: '+91', category: 'Wi-fi Related Complaints', subject: '', description: '' });
    const [phoneError, setPhoneError] = useState('');
    const countryCodes = ['+91', '+1', '+44', '+61', '+81'];

    useEffect(() => {
        if (profile) setFormData(prev => ({ ...prev, name: profile.name || '', regNo: profile.regNo || '' }));
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'roomNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 4) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setPhoneError('');
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setPhoneError('Phone number must be exactly 10 digits.');
            return;
        }
        if (!user) { alert("You must be logged in to submit a complaint."); return; }
        try {
            const fullPhoneNumber = `${formData.countryCode}${formData.phone}`;
            await addDoc(collection(db, "complaints"), { ...formData, phone: fullPhoneNumber, userId: user.uid, status: 'Submitted', createdAt: new Date() });
            setView('dashboard');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to submit complaint.");
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Register a New Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Name</label><input type="text" name="name" value={formData.name} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed" required disabled /></div>
                    <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Registration No.</label><input type="text" name="regNo" value={formData.regNo} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed" required disabled /></div>
                    <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Block</label><select name="block" value={formData.block} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required>{blockOptions.slice(1).map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                    <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Room Number</label><input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required /></div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Phone Number</label>
                        <div className="flex">
                            <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="px-2 bg-gray-50 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none">
                                {countryCodes.map(code => <option key={code} value={code}>{code}</option>)}
                            </select>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg" required />
                        </div>
                        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                    </div>
                    <div><label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required>{categoryOptions.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Subject</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" required></textarea>
                </div>
                <div className="flex justify-end">
                    <button type="button" onClick={() => setView('dashboard')} className="px-6 py-2 mr-3 font-semibold text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancel</button>
                    <button type="submit" className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Submit Complaint</button>
                </div>
            </form>
        </div>
    );
}