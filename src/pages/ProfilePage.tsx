import React, { useState } from 'react';
import { usePlayerAuth } from '../contexts/PlayerAuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import AchievementList from '../components/AchievementList';
import StatsDetail from '../components/StatsDetail';
import { User, Lock, Award, BarChart3, Edit, AtSign, ChevronLeft, LogIn } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

enum ProfileView {
  PROFILE = 'profile',
  STATS = 'stats',
  ACHIEVEMENTS = 'achievements',
  EDIT = 'edit',
}

const ProfilePage: React.FC = () => {
  const { playerAuth, updatePlayerProfile, signIn, signUp, signInAsGuest, signInWithGoogle } = usePlayerAuth();
  const [currentView, setCurrentView] = useState<ProfileView>(ProfileView.PROFILE);
  const navigate = useNavigate();
  
  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit profile state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  // Add guest name state
  const [guestName, setGuestName] = useState('');
  
  // Initialize edit form when entering edit mode
  const handleEditClick = () => {
    if (playerAuth.profile) {
      setEditDisplayName(playerAuth.profile.displayName);
      setAvatarUrl(playerAuth.profile.avatar);
      setSelectedTheme(playerAuth.profile.customization.theme);
    }
    setCurrentView(ProfileView.EDIT);
  };
  
  // Handle authentication form submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Display name is required');
        }
        await signUp(email, password, displayName);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle profile edit form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerAuth.profile) return;
    
    try {
      await updatePlayerProfile({
        displayName: editDisplayName,
        avatar: avatarUrl,
        customization: {
          ...playerAuth.profile.customization,
          theme: selectedTheme
        }
      });
      
      setCurrentView(ProfileView.PROFILE);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  
  // Handle guest sign-in
  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("👤 Guest sign-in button clicked");
    setAuthError(null);
    setIsSubmitting(true);
    
    try {
      console.log("🔄 Starting guest sign-in process with name:", guestName.trim() || 'Guest');
      const profile = await signInAsGuest(guestName.trim() || 'Guest');
      console.log("✅ Guest profile created successfully:", profile);
    } catch (error: any) {
      console.error("❌ Guest auth error:", error);
      setAuthError(error.message || 'Failed to create guest profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      console.log("🔍 Google sign-in button clicked");
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("❌ Google auth error:", error);
      setAuthError(error.message || 'Failed to sign in with Google');
    }
  };
  
  // Render loading state
  if (playerAuth.isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }
  
  // Modified auth form rendering when not authenticated
  if (!playerAuth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Game Profile
            </h1>
            <p className="text-gray-400">
              Track your stats and achievements as you play
            </p>
          </div>
          
          {/* Guest login (recommended) */}
          <div className="bg-gradient-to-r from-indigo-800/30 to-purple-800/30 backdrop-blur-lg rounded-2xl p-6 border border-indigo-800/50 mb-6 hover:border-indigo-700/70 transition-all">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
              <span className="bg-indigo-500 text-white px-2 py-0.5 text-xs font-bold rounded-md mr-2">RECOMMENDED</span>
              Quick Play as Guest
            </h2>
            
            <div className="bg-indigo-900/20 rounded-lg p-3 mb-4">
              <p className="text-indigo-200 text-sm">
                Guest profiles are stored on your device. All gameplay stats and achievements will be tracked without needing an account!
              </p>
            </div>
            
            <form onSubmit={handleGuestSignIn}>
              <div className="mb-4">
                <label htmlFor="guestName" className="block text-sm font-medium text-indigo-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-indigo-700/50 rounded-lg
                            text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg
                           text-white text-lg font-medium transition-all duration-300 hover:shadow-lg hover:from-indigo-500 hover:to-purple-500
                           animate-pulse"
                disabled={isSubmitting}
                onClick={() => console.log("🖱️ Guest button clicked via onClick")}
              >
                {isSubmitting ? 'Creating Profile...' : '➡️ Play as Guest'}
              </button>
            </form>
          </div>
          
          {/* Authentication error notice */}
          {localStorage.getItem('auth_cors_error') === 'true' && (
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-amber-200 text-sm font-medium">Firebase Authentication Unavailable</p>
                  <p className="text-amber-200/70 text-xs mt-1">
                    We've detected CORS issues with Firebase Authentication. 
                    We recommend using Guest Mode for now. Your gameplay data will still be saved locally.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Account login options */}
          <div className="bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-800/50">
            <h2 className="text-lg font-semibold text-white mb-4">Account Login</h2>
            
            {/* Google sign-in */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full mb-4 py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg flex items-center justify-center transition-all"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
            
            {/* Regular auth tabs */}
            <div className="flex mb-6 p-1 bg-gray-800/50 rounded-lg">
              <button
                className={`flex-1 py-3 font-medium rounded-lg transition-all duration-300
                          ${authMode === 'signin'
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg'
                              : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                onClick={() => setAuthMode('signin')}
                disabled={isSubmitting}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 font-medium rounded-lg transition-all duration-300
                          ${authMode === 'signup'
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg'
                              : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                onClick={() => setAuthMode('signup')}
                disabled={isSubmitting}
              >
                Sign Up
              </button>
            </div>
            
            {/* Auth form */}
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="mb-4">
                  <label htmlFor="displayName" className="block text-sm font-medium text-indigo-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full pl-10 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                                text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-indigo-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full pl-10 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                              text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-indigo-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-10 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                              text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {authError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-300 text-sm">
                  {authError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg
                           text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-indigo-500 hover:to-purple-500"
                disabled={isSubmitting}
                onClick={() => console.log("🔒 Auth form submit button clicked")}
              >
                {isSubmitting 
                  ? 'Processing...' 
                  : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
              
              <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Back to Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  // User is authenticated, render profile sections
  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Top navigation */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-indigo-400 hover:text-indigo-300"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Home
          </button>
          
          {/* Profile section tabs */}
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentView(ProfileView.PROFILE)}
              className={`p-2 rounded-lg transition-colors ${
                currentView === ProfileView.PROFILE
                  ? 'bg-indigo-600/30 text-white'
                  : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
            >
              <User size={18} />
            </button>
            <button 
              onClick={() => setCurrentView(ProfileView.STATS)}
              className={`p-2 rounded-lg transition-colors ${
                currentView === ProfileView.STATS
                  ? 'bg-indigo-600/30 text-white'
                  : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
            >
              <BarChart3 size={18} />
            </button>
            <button 
              onClick={() => setCurrentView(ProfileView.ACHIEVEMENTS)}
              className={`p-2 rounded-lg transition-colors ${
                currentView === ProfileView.ACHIEVEMENTS
                  ? 'bg-indigo-600/30 text-white'
                  : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
            >
              <Award size={18} />
            </button>
          </div>
        </div>
        
        {/* Content based on current view */}
        {currentView === ProfileView.PROFILE && playerAuth.profile && (
          <ProfileCard 
            profile={playerAuth.profile} 
            onEditClick={handleEditClick}
          />
        )}
        
        {currentView === ProfileView.STATS && playerAuth.profile && (
          <StatsDetail profile={playerAuth.profile} />
        )}
        
        {currentView === ProfileView.ACHIEVEMENTS && playerAuth.profile && (
          <AchievementList achievements={playerAuth.profile.achievements} />
        )}
        
        {currentView === ProfileView.EDIT && playerAuth.profile && (
          <div className="bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-800/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
              <button 
                onClick={() => setCurrentView(ProfileView.PROFILE)}
                className="p-1.5 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label htmlFor="editDisplayName" className="block text-sm font-medium text-indigo-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="editDisplayName"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                            text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-indigo-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="text"
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                            text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="mt-2 text-gray-400 text-sm">
                  Leave empty to use generated avatar
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['default', 'dark', 'forest', 'sunset', 'ocean', 'neon'].map(theme => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`py-2 px-3 rounded-lg border transition-all text-center capitalize ${
                        selectedTheme === theme
                          ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                          : 'bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-800/50'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentView(ProfileView.PROFILE)}
                  className="py-2 px-4 bg-gray-800/50 rounded-lg text-gray-300 hover:bg-gray-800/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg
                             text-white hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 