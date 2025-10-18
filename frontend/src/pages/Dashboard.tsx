import { useTheme } from '../hooks/useTheme';
import { useGoals } from '../contexts/GoalsContext';
import GoalCard from '../components/GoalCard';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Target, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { theme } = useTheme();
    const { goals, updateStatus, removeGoal } = useGoals();

    const notStarted = goals.filter(g => g.status === 'not_started').length;
    const inProgress = goals.filter(g => g.status === 'in_progress').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1
            }
        }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div 
            className="space-y-8 p-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-6 rounded-xl border border-border/50 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Your Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Track your goals and progress at a glance</p>
                </div>
                <Link to="/goals" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <Plus size={16} />
                    <span>New Goal</span>
                </Link>
            </motion.header>

            {/* Status summary with icons and improved styling */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div 
                    whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
                    className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Not Started</p>
                        <p className="text-3xl font-bold text-foreground">{notStarted}</p>
                    </div>
                </motion.div>
                
                <motion.div 
                    whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
                    className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                        <p className="text-3xl font-bold text-foreground">{inProgress}</p>
                    </div>
                </motion.div>
                
                <motion.div 
                    whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
                    className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="text-3xl font-bold text-foreground">{completed}</p>
                    </div>
                </motion.div>
            </motion.section>

            {/* Recent goals with improved styling */}
            <motion.section variants={itemVariants} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Target className="text-primary" size={20} />
                        <h2 className="text-xl font-semibold">Recent Goals</h2>
                    </div>
                    <Link to="/goals" className="text-sm text-primary flex items-center gap-1 hover:underline">
                        View all <ArrowRight size={14} />
                    </Link>
                </div>
                
                {goals.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No goals yet. Start by creating your first goal!</p>
                        <Link to="/goals" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                            <Plus size={16} />
                            <span>Create Goal</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {goals.slice(0, 5).map((goal, index) => (
                            <motion.div 
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <GoalCard
                                    goal={goal}
                                    onUpdateStatus={(status) => updateStatus(goal.id, status)}
                                    onRemove={() => removeGoal(goal.id)}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.section>
        </motion.div>
    )
}

export default Dashboard