import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, Clock, User, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { PriorityBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Tasks = () => {
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [taskRes, userRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users')
      ]);
      if (taskRes.data?.success && Array.isArray(taskRes.data.tasks)) {
        setTasks(taskRes.data.tasks);
      } else {
        setTasks([]);
      }
      if (userRes.data?.users && Array.isArray(userRes.data.users)) {
        setUsers(userRes.data.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setTasks([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.dueDate) {
      showError('Title and due date are required');
      return;
    }
    try {
      const res = await api.post('/tasks', taskForm);
      if (res.data?.success) {
        showSuccess('Task created');
        setIsCreateModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'MEDIUM',
          dueDate: new Date().toISOString().split('T')[0]
        });
        fetchTasks();
      }
    } catch (err) {
      showError('Failed to create task');
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (res.data?.success) {
        showSuccess(`Task marked as ${newStatus}`);
        fetchTasks();
      }
    } catch (err) {
      showError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.data?.success) {
        showSuccess('Task deleted');
        fetchTasks();
      }
    } catch (err) {
      showError('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-crm-navy">Team Task Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Assign sales activities, set priorities, and track task progress</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {loading ? (
        <Loader message="Fetching tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="Create tasks to manage team action items and lead deliverables."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`p-4 bg-white rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                task.status === 'COMPLETED' ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200/80 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-bold text-crm-navy ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <PriorityBadge priority={task.priority} />
                </div>

                {task.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>

                  {task.assignedTo?.name && (
                    <span className="flex items-center gap-1 text-crm-navy">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {task.assignedTo.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleComplete(task._id, task.status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    task.status === 'COMPLETED'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {task.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Done'}
                </button>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Prepare proposal document for client"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Provide context or instructions..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Team Member</label>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs"
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
