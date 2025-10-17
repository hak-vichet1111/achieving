import { useTheme } from '../hooks/useTheme';
import { useGoals } from '../contexts/GoalsContext';
import GoalCard from '../components/GoalCard';

const Dashboard = () => {
    const { theme } = useTheme();
    const { goals, updateStatus, removeGoal } = useGoals();

    const notStarted = goals.filter(g => g.status === 'not_started').length;
    const inProgress = goals.filter(g => g.status === 'in_progress').length;
    const completed = goals.filter(g => g.status === 'completed').length;

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                <p className="text-muted-foreground">Theme: <span className="font-medium">{theme}</span></p>
            </header>

            {/* Status summary */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Not Started</p>
                    <p className="text-3xl font-bold text-foreground">{notStarted}</p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-3xl font-bold text-foreground">{inProgress}</p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-foreground">{completed}</p>
                </div>
            </section>

            {/* Recent goals */}
            <section className="bg-card rounded-lg p-6 border border-border">
                <h2 className="text-xl font-semibold mb-4">Recent goals</h2>
                {goals.length === 0 ? (
                    <p className="text-muted-foreground">No goals yet. Create your first goal from the Goals page.</p>
                ) : (
                    <div className="space-y-3">
                        {goals.slice(0, 5).map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onUpdateStatus={(status) => updateStatus(goal.id, status)}
                                onRemove={() => removeGoal(goal.id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>

    )
}

export default Dashboard