import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Gamepad2, 
  BarChart3, 
  User, 
  Trophy,
  X 
} from 'lucide-react'
import { useSelector } from 'react-redux'

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Games',
      href: '/games',
      icon: Gamepad2,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-gray-800 font-semibold">MindMeld</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-gray-800 font-medium">{user?.firstName || 'User'}</div>
                <div className="text-gray-500 text-sm">Level {user?.level || 1}</div>
              </div>
            </div>
            
            {/* XP Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>XP Progress</span>
                <span>{user?.xp || 0} / {((user?.level || 1) * 1000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((user?.xp || 0) % 1000) / 10)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 bg-white/95 backdrop-blur-sm overflow-y-auto">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-700 border border-blue-200' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="text-center text-gray-500 text-sm">
              <div>Streak: {user?.streak || 0} days</div>
              <div className="mt-1">🔥 Keep it up!</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar