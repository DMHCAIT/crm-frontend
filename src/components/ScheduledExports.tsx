import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { Clock, Plus, Trash2, Edit, CheckCircle, AlertCircle } from 'lucide-react';

interface ScheduledExport {
  id: string;
  name: string;
  exportType: 'leads' | 'students' | 'analytics' | 'full';
  format: 'csv' | 'pdf' | 'xlsx';
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule: string; // Cron expression or simple time
  email: string;
  lastRun?: string;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  filters?: any;
}

const ScheduledExports: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    exportType: 'leads' as 'leads' | 'students' | 'analytics' | 'full',
    format: 'csv' as 'csv' | 'pdf' | 'xlsx',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    email: user?.email || ''
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.getScheduledExports();
      setSchedules(response.schedules || []);
    } catch (error) {
      console.error('Failed to load scheduled exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const apiClient = getApiClient();
      await apiClient.createScheduledExport({
        ...newSchedule,
        nextRun: calculateNextRun(newSchedule.frequency, newSchedule.time),
        status: 'active'
      });
      
      setShowCreateModal(false);
      setNewSchedule({
        name: '',
        exportType: 'leads',
        format: 'csv',
        frequency: 'weekly',
        time: '09:00',
        email: user?.email || ''
      });
      
      loadSchedules();
    } catch (error) {
      console.error('Failed to create scheduled export:', error);
    }
  };

  const calculateNextRun = (frequency: string, time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }
    
    return nextRun.toISOString();
  };

  const toggleSchedule = async (id: string, currentStatus: string) => {
    try {
      const apiClient = getApiClient();
      await apiClient.updateScheduledExport(id, {
        status: currentStatus === 'active' ? 'paused' : 'active'
      });
      loadSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled export?')) return;
    
    try {
      const apiClient = getApiClient();
      await apiClient.deleteScheduledExport(id);
      loadSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Scheduled Exports</h2>
          <p className="text-gray-600 mt-1">Automate your data exports with scheduled tasks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Schedules List */}
      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No scheduled exports yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first scheduled export
            </button>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{schedule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      schedule.status === 'active' ? 'bg-green-100 text-green-800' :
                      schedule.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium capitalize">{schedule.exportType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Format</p>
                      <p className="font-medium uppercase">{schedule.format}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frequency</p>
                      <p className="font-medium capitalize">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email To</p>
                      <p className="font-medium">{schedule.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500">
                    {schedule.lastRun && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Last run: {new Date(schedule.lastRun).toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Next run: {new Date(schedule.nextRun).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSchedule(schedule.id, schedule.status)}
                    className={`p-2 rounded hover:bg-gray-100 ${
                      schedule.status === 'active' ? 'text-yellow-600' : 'text-green-600'
                    }`}
                    title={schedule.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {schedule.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create Scheduled Export</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Weekly Leads Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Export Type
                </label>
                <select
                  value={newSchedule.exportType}
                  onChange={(e) => setNewSchedule({...newSchedule, exportType: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="leads">Leads Data</option>
                  <option value="students">Students Data</option>
                  <option value="analytics">Analytics Report</option>
                  <option value="full">Full System Export</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule({...newSchedule, format: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({...newSchedule, frequency: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email To
                </label>
                <input
                  type="email"
                  value={newSchedule.email}
                  onChange={(e) => setNewSchedule({...newSchedule, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={!newSchedule.name || !newSchedule.email}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledExports;
