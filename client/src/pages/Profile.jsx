import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfile } from '../store/slices/authSlice'
import { fetchAchievements, submitFeedback } from '../store/slices/userSlice'
import { 
  User, 
  Settings, 
  Award, 
  BarChart3, 
  MessageSquare,
  Save,
  Trophy,
  Target,
  Calendar,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const Profile = () => {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state) => state.auth)
  const { achievements } = useSelector((state) => state.user)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    profession: '',
    cognitiveGoal: ''
  })
  const [feedbackData, setFeedbackData] = useState({
    type: 'general',
    message: '',
    rating: 5
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: user.age || '',
        profession: user.profession || '',
        cognitiveGoal: user.cognitiveGoal || ''
      })
    }
    dispatch(fetchAchievements())
  }, [user, dispatch])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      await dispatch(updateProfile(profileData)).unwrap()
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(submitFeedback(feedbackData)).unwrap()
      toast.success('Feedback submitted successfully!')
      setFeedbackData({ type: 'general', message: '', rating: 5 })
    } catch (error) {
      toast.error('Failed to submit feedback')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'achievements', name: 'Achievements', icon: <Award className="w-4 h-4" /> },
    { id: 'stats', name: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'feedback', name: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {user?.fullName}
        </h1>
        <p className="text-gray-600">
          Level {user?.level} • {user?.xp} XP • {user?.streak} day streak
        </p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }
              `}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'profile' && (
            <ProfileTab
              profileData={profileData}
              setProfileData={setProfileData}
              onSubmit={handleProfileUpdate}
              loading={loading}
            />
          )}
          
          {activeTab === 'achievements' && (
            <AchievementsTab achievements={achievements} />
          )}
          
          {activeTab === 'stats' && (
            <StatsTab user={user} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab user={user} />
          )}
          
          {activeTab === 'feedback' && (
            <FeedbackTab
              feedbackData={feedbackData}
              setFeedbackData={setFeedbackData}
              onSubmit={handleFeedbackSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const ProfileTab = ({ profileData, setProfileData, onSubmit, loading }) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          First Name
        </label>
        <input
          type="text"
          value={profileData.firstName}
          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
          className="input-field"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Last Name
        </label>
        <input
          type="text"
          value={profileData.lastName}
          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
          className="input-field"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Age
        </label>
        <input
          type="number"
          min="13"
          max="120"
          value={profileData.age}
          onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) })}
          className="input-field"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Profession
        </label>
        <input
          type="text"
          value={profileData.profession}
          onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
          className="input-field"
          required
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Primary Cognitive Goal
        </label>
        <select
          value={profileData.cognitiveGoal}
          onChange={(e) => setProfileData({ ...profileData, cognitiveGoal: e.target.value })}
          className="input-field"
          required
        >
          <option value="">Select a goal</option>
          <option value="memory">Improve Memory</option>
          <option value="attention">Enhance Attention</option>
          <option value="processing_speed">Increase Processing Speed</option>
          <option value="problem_solving">Better Problem Solving</option>
          <option value="overall">Overall Cognitive Health</option>
        </select>
      </div>
    </div>
    
    <button
      type="submit"
      disabled={loading}
      className="btn-primary flex items-center space-x-2"
    >
      <Save className="w-4 h-4" />
      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
    </button>
  </form>
)

const AchievementsTab = ({ achievements }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
    
    {achievements.length === 0 && (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg mb-2">
          No achievements yet
        </div>
        <div className="text-gray-400 text-sm">
          Complete games to earn your first achievements!
        </div>
      </div>
    )}
  </div>
)

const AchievementCard = ({ achievement }) => (
  <div className={`
    p-4 rounded-lg border-2 transition-all duration-200
    ${achievement.completed
      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
      : 'bg-gray-50 border-gray-200'}
  `}>
    <div className="flex items-start justify-between mb-3">
      <div className="text-2xl">
        {achievement.completed ? '🏆' : '🔒'}
      </div>
      <div className={`
        px-2 py-1 rounded text-xs
        ${achievement.category === 'milestone' ? 'bg-blue-500/20 text-blue-600' :
          achievement.category === 'performance' ? 'bg-green-500/20 text-green-600' :
          achievement.category === 'consistency' ? 'bg-purple-500/20 text-purple-600' :
          'bg-gray-500/20 text-gray-600'}
      `}>
        {achievement.category}
      </div>
    </div>
    
    <div className="mb-3">
      <div className={`font-semibold mb-1 ${achievement.completed ? 'text-yellow-600' : 'text-gray-800'}`}>
        {achievement.name}
      </div>
      <div className="text-gray-600 text-sm">
        {achievement.description}
      </div>
    </div>
    
    {!achievement.completed && (
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{achievement.progress} / {achievement.target}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
          />
        </div>
      </div>
    )}
    
    <div className="text-xs text-gray-400">
      Reward: {achievement.reward}
    </div>
  </div>
)

const StatsTab = ({ user }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Target className="w-6 h-6" />}
        title="Total Sessions"
        value={user?.stats?.totalSessions || 0}
        color="from-blue-500 to-cyan-500"
      />
      <StatCard
        icon={<Calendar className="w-6 h-6" />}
        title="Play Time"
        value={`${Math.floor((user?.stats?.totalPlayTime || 0) / 60)}h`}
        color="from-green-500 to-emerald-500"
      />
      <StatCard
        icon={<Zap className="w-6 h-6" />}
        title="Best Streak"
        value={`${user?.stats?.bestStreak || 0} days`}
        color="from-yellow-500 to-orange-500"
      />
      <StatCard
        icon={<Trophy className="w-6 h-6" />}
        title="Avg Score"
        value={`${Math.round(user?.stats?.averageScore || 0)}%`}
        color="from-purple-500 to-pink-500"
      />
    </div>
    
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Games Played</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {user?.stats?.gamesPlayed && Object.entries(user.stats.gamesPlayed).map(([game, count]) => (
          <div key={game} className="text-center">
            <div className="text-2xl font-bold text-gray-800">{count}</div>
            <div className="text-gray-500 text-sm capitalize">
              {game.replace('-', ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-sm mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
      <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
        {icon}
      </div>
    </div>
  </div>
)

const SettingsTab = ({ user }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-gray-800 font-medium">Notifications</div>
            <div className="text-gray-500 text-sm">Receive training reminders</div>
          </div>
          <input
            type="checkbox"
            defaultChecked={user?.preferences?.notifications}
            className="w-5 h-5 text-blue-600 rounded"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-gray-800 font-medium">Data Sharing</div>
            <div className="text-gray-500 text-sm">Share anonymous data for research</div>
          </div>
          <input
            type="checkbox"
            defaultChecked={user?.preferences?.dataSharing}
            className="w-5 h-5 text-blue-600 rounded"
          />
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Account</h3>
      <div className="space-y-3">
        <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="text-gray-800 font-medium">Change Password</div>
          <div className="text-gray-500 text-sm">Update your account password</div>
        </button>
        
        <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="text-gray-800 font-medium">Export Data</div>
          <div className="text-gray-500 text-sm">Download your performance data</div>
        </button>
        
        <button className="w-full text-left p-4 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30">
          <div className="text-red-600 font-medium">Delete Account</div>
          <div className="text-red-500 text-sm">Permanently delete your account</div>
        </button>
      </div>
    </div>
  </div>
)

const FeedbackTab = ({ feedbackData, setFeedbackData, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Feedback Type
      </label>
      <select
        value={feedbackData.type}
        onChange={(e) => setFeedbackData({ ...feedbackData, type: e.target.value })}
        className="input-field"
      >
        <option value="general">General Feedback</option>
        <option value="bug">Bug Report</option>
        <option value="feature">Feature Request</option>
        <option value="game">Game Feedback</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Rating (1-5)
      </label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setFeedbackData({ ...feedbackData, rating })}
            className={`
              w-10 h-10 rounded-full transition-colors
              ${feedbackData.rating >= rating
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            ★
          </button>
        ))}
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Message
      </label>
      <textarea
        value={feedbackData.message}
        onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
        className="input-field h-32 resize-none"
        placeholder="Tell us about your experience..."
        required
      />
    </div>
    
    <button type="submit" className="btn-primary">
      Submit Feedback
    </button>
  </form>
)

export default Profile