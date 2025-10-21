'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Download,
  Upload,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, storage } from '@/utils';
import { toast } from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  location?: string;
  joinDate: string;
  lastLogin: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      security: boolean;
      reports: boolean;
    };
    dashboard: {
      autoRefresh: boolean;
      refreshInterval: number;
      compactView: boolean;
    };
    language: string;
    timezone: string;
  };
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Security Administrator',
    email: 'admin@defenddos.com',
    role: 'System Administrator',
    phone: '+1 (555) 123-4567',
    location: 'Security Operations Center',
    joinDate: '2024-01-15',
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        security: true,
        reports: false,
      },
      dashboard: {
        autoRefresh: true,
        refreshInterval: 30,
        compactView: false,
      },
      language: 'en',
      timezone: 'UTC',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user profile from storage
    const savedProfile = storage.get('userProfile');
    if (savedProfile) {
      setUserProfile({ ...userProfile, ...savedProfile });
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (in real app, save to backend)
      storage.set('userProfile', userProfile);
      
      // Apply theme change
      const root = document.documentElement;
      if (userProfile.preferences.theme === 'dark') {
        root.classList.add('dark');
      } else if (userProfile.preferences.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
      
      toast.success('Profile updated successfully');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      profile: userProfile,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defenddos-profile-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Profile data exported successfully');
  };

  const updateProfile = (path: string, value: any) => {
    const keys = path.split('.');
    const newProfile = { ...userProfile };
    let current: any = newProfile;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setUserProfile(newProfile);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.1 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  User Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your account and preferences
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {activeTab === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Profile Header */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {userProfile.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {userProfile.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {userProfile.email}
                        </p>
                        <Badge variant="primary" className="mt-2">
                          {userProfile.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={userProfile.name}
                          onChange={(e) => updateProfile('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => updateProfile('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={userProfile.phone || ''}
                          onChange={(e) => updateProfile('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={userProfile.location || ''}
                          onChange={(e) => updateProfile('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Account Info */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold">Account Information</h4>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Member since
                              </div>
                              <div className="font-medium">
                                {new Date(userProfile.joinDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Last login
                              </div>
                              <div className="font-medium">
                                {new Date(userProfile.lastLogin).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Appearance */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          <h4 className="font-semibold">Appearance</h4>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Theme
                            </label>
                            <div className="flex gap-3">
                              {[
                                { value: 'light', label: 'Light', icon: Sun },
                                { value: 'dark', label: 'Dark', icon: Moon },
                                { value: 'system', label: 'System', icon: Monitor },
                              ].map(({ value, label, icon: Icon }) => (
                                <button
                                  key={value}
                                  onClick={() => updateProfile('preferences.theme', value)}
                                  className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                                    userProfile.preferences.theme === value
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-600'
                                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          <h4 className="font-semibold">Notifications</h4>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(userProfile.preferences.notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {key === 'email' && 'Receive email notifications'}
                                  {key === 'push' && 'Browser push notifications'}
                                  {key === 'security' && 'Security alerts and warnings'}
                                  {key === 'reports' && 'Daily and weekly reports'}
                                </div>
                              </div>
                              <button
                                onClick={() => updateProfile(`preferences.notifications.${key}`, !value)}
                                className={cn(
                                  'relative w-11 h-6 rounded-full transition-colors',
                                  value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                                )}
                              >
                                <div
                                  className={cn(
                                    'absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform',
                                    value ? 'translate-x-5' : 'translate-x-0.5'
                                  )}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dashboard Settings */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Monitor className="w-5 h-5" />
                          <h4 className="font-semibold">Dashboard</h4>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Auto Refresh</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Automatically refresh dashboard data
                              </div>
                            </div>
                            <button
                              onClick={() => updateProfile('preferences.dashboard.autoRefresh', !userProfile.preferences.dashboard.autoRefresh)}
                              className={cn(
                                'relative w-11 h-6 rounded-full transition-colors',
                                userProfile.preferences.dashboard.autoRefresh ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                              )}
                            >
                              <div
                                className={cn(
                                  'absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform',
                                  userProfile.preferences.dashboard.autoRefresh ? 'translate-x-5' : 'translate-x-0.5'
                                )}
                              />
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Refresh Interval (seconds)
                            </label>
                            <select
                              value={userProfile.preferences.dashboard.refreshInterval}
                              onChange={(e) => updateProfile('preferences.dashboard.refreshInterval', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value={10}>10 seconds</option>
                              <option value={30}>30 seconds</option>
                              <option value={60}>1 minute</option>
                              <option value={300}>5 minutes</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Password */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          <h4 className="font-semibold">Password & Authentication</h4>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button variant="outline">
                            Change Password
                          </Button>
                          <Button variant="outline">
                            Enable Two-Factor Authentication
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Management */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          <h4 className="font-semibold">Data Management</h4>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={handleExportData}>
                              <Download className="w-4 h-4 mr-2" />
                              Export Data
                            </Button>
                            <Button variant="outline">
                              <Upload className="w-4 h-4 mr-2" />
                              Import Settings
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Export your profile data and settings, or import from a backup file.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}