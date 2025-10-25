import { createBrowserRouter } from 'react-router-dom'
import LayoutSidebar from './layouts/LayoutSidebar'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import SpendDetails from './pages/SpendDetails'
import Spend from './pages/Spend'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  // App routes under sidebar layout
  {
    path: '/',
    element: <LayoutSidebar />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/goals',
        element: <Goals />,
      },
      {
        path: '/goals/:goalId',
        element: <GoalDetails />,
      },
      {
        path: '/spend',
        element: <Spend />, // Overview of monthly summaries
      },
      {
        path: '/spend/:monthId',
        element: <SpendDetails />, // Detailed spending for a specific month
      }
    ]
  },
])

export default router