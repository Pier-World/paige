import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TaskCard } from '../components/ui/TaskCard';

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
    }
  }, [user, filter]);

  async function loadTasks() {
    if (!user) return;

    try {
      let query = supabase.from('tasks').select('*').eq('user_id', user.id);

      if (filter === 'active') {
        query = query.in('status', ['pending', 'in_progress']);
      } else if (filter === 'awaiting_review') {
        query = query.eq('status', 'awaiting_human');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tasks</h1>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          {(['all', 'active', 'awaiting_review', 'completed'] as TaskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pb-2 px-4 capitalize transition-colors ${
                filter === f
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="detailed" />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TasksPage;

