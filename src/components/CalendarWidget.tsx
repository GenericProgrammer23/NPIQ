import React from 'react';
import { useTasks } from '../hooks/useDatabase';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export const CalendarWidget: React.FC = () => {
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks
      .filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= today && task.status !== 'completed';
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const upcomingTasks = getUpcomingTasks();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-navy dark:text-white mb-4 flex items-center">
        <CalendarIcon className="h-5 w-5 mr-2" />
        Calendar & Upcoming Tasks
      </h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            ←
          </button>
          <h3 className="font-semibold text-navy dark:text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-navy/60 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const tasksForDay = getTasksForDate(date);
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();
            const isSelected =
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square flex flex-col items-center justify-center rounded text-sm transition-colors ${
                  isToday
                    ? 'bg-blue-500 text-white font-bold'
                    : isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-navy dark:text-white font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-navy dark:text-white'
                }`}
              >
                <span>{day}</span>
                {tasksForDay.length > 0 && (
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-navy/10 dark:border-gray-700 pt-4">
        <h3 className="font-semibold text-navy dark:text-white mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Upcoming Tasks
        </h3>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <AlertCircle className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy dark:text-white truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-navy/60 dark:text-gray-400">
                    {task.due_date && formatDate(task.due_date)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${
                    task.priority === 'urgent'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : task.priority === 'high'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      : task.priority === 'medium'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-navy/60 dark:text-gray-400">No upcoming tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};
