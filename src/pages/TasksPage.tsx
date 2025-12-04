import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EnhancedTaskCard } from '../components/ui/EnhancedTaskCard';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'awaiting_human' | 'completed' | 'failed';
  assigned_agent?: string;
  requires_human?: boolean;
  created_at: string;
  due_date?: string;
  priority?: number;
  task_type?: string;
}

type TaskFilter = 'all' | 'active' | 'awaiting_review' | 'completed';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      // If no user, clear loading state immediately
      setLoading(false);
    }
  }, [user, filter]);

  async function loadTasks() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use Promise.race to handle timeout properly
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('Tasks load timeout - queries taking too long');
          resolve(null);
        }, 15000); // Increased to 15 seconds
      });

      let query = supabase.from('tasks').select('*').eq('user_id', user.id);

      if (filter === 'active') {
        query = query.in('status', ['pending', 'in_progress']);
      } else if (filter === 'awaiting_review') {
        query = query.eq('status', 'awaiting_human');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const queryPromise = query.order('created_at', { ascending: false });

      // Race between query and timeout
      let result: any = null;
      let timedOut = false;
      
      try {
        result = await Promise.race([
          queryPromise,
          timeoutPromise.then(() => {
            timedOut = true;
            return null;
          })
        ]);
      } catch (error) {
        console.error('Error in Promise.race:', error);
        timedOut = true;
      }
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If timeout won, result will be null
      if (timedOut || result === null) {
        console.error('Tasks query timed out');
        setLoading(false);
        setTasks([]);
        return;
      }

      const { data, error } = result;

      if (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <main className="pt-24 pb-20 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="mb-8">
            <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
              Tasks
            </h1>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Manage your active tasks and requests
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mb-8 border-b border-border">
            {(['all', 'active', 'awaiting_review', 'completed'] as TaskFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pb-3 px-4 capitalize transition-colors ${
                  filter === f
                    ? 'border-b-2 border-accent text-text-primary opacity-100'
                    : 'text-text-primary opacity-60 hover:opacity-100'
                }`}
                style={{ fontSize: '14px', fontWeight: 300 }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Task List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-tertiary" style={{ fontSize: '14px', fontWeight: 300 }}>
                No tasks found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EnhancedTaskCard taskId={task.id} variant="detailed" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
};

export default TasksPage;
