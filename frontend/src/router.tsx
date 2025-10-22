import { createBrowserRouter } from 'react-router-dom'
import LayoutSidebar from './layouts/LayoutSidebar'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import Spending from './pages/Spending'

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
                path: '/spending',
                element: <Spending />,
            }
        ]

    },
])

export default router