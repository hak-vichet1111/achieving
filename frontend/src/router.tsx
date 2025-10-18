import { createBrowserRouter } from 'react-router-dom'
import LayoutSidebar from './layouts/LayoutSidebar'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import Tasks from './pages/Tasks'

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
                path: '/tasks',
                element: <Tasks />,
            }
        ]

    },
])

export default router