import { createBrowserRouter } from 'react-router-dom'
import LayoutSidebar from './layouts/LayoutSidebar'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import SpendDetails from './pages/SpendDetails'
import Spend from './pages/Spend'

const router = createBrowserRouter([
    {
        path: '/',
        element: <LayoutSidebar />,
        // element: <LayoutNavbar />,
        children: [
            {
                index: true,
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