import React, { useState, useEffect } from 'react';
import HomeButton from '../components/HomeButton';
import emailService from '../services/emailService';

function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    enableInvitationEmails: true,
    enableWelcomeEmails: true,
    enablePasswordResetEmails: true,
    enableNotificationEmails: true,
    emailFromName: '',
    emailFromAddress: '',
    sendGridApiKey: '',
    sendGridConfig: {
      validated: false,
      lastValidated: null,
      accountInfo: null
    }
  });
  const [testEmail, setTestEmail] = useState('');
  const [previewType, setPreviewType] = useState('invitation');
  const [emailPreview, setEmailPreview] = useState(null);
  const [emailStats, setEmailStats] = useState(null);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      // Load settings from environment and localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const settings = {
        enableInvitationEmails: true,
        enableWelcomeEmails: true,
        enablePasswordResetEmails: true,
        enableNotificationEmails: true,
        emailFromName: currentUser.companyName || 'Workforce Management',
        emailFromAddress: process.env.REACT_APP_FROM_EMAIL || 'noreply@workforce.com',
        sendGridApiKey: process.env.REACT_APP_SENDGRID_API_KEY || '',
        sendGridConfig: {
          validated: false,
          lastValidated: null,
          accountInfo: null
        }
      };
      setEmailSettings(settings);

      // Auto-validate if API key exists
      if (settings.sendGridApiKey) {
        await validateSendGridKey(settings.sendGridApiKey);
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
      setError('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const validateSendGridKey = async (apiKey) => {
    try {
      // Temporarily set the API key for validation
      const originalKey = emailService.sendGridApiKey;
      emailService.sendGridApiKey = apiKey;
      
      const isValid = await emailService.validateSendGridConfig();
      
      // Restore original key
      emailService.sendGridApiKey = originalKey;

      setEmailSettings(prev => ({
        ...prev,
        sendGridConfig: {
          validated: isValid,
          lastValidated: isValid ? new Date().toISOString() : null,
          accountInfo: isValid ? { status: 'active' } : null
        }
      }));

      return isValid;
    } catch (error) {
      console.error('SendGrid validation error:', error);
      return false;
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate SendGrid API key if provided
      if (emailSettings.sendGridApiKey) {
        const isValid = await validateSendGridKey(emailSettings.sendGridApiKey);
        if (!isValid) {
          setError('Invalid SendGrid API key. Please check your API key and try again.');
          return;
        }
      }

      // In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Email settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      if (!testEmail) {
        setError('Please enter a test email address');
        return;
      }

      if (!emailSettings.sendGridApiKey) {
        setError('Please configure SendGrid API key first');
        return;
      }

      setTesting(true);
      setError('');
      setSuccess('');

      // Temporarily set the API key for testing
      const originalKey = emailService.sendGridApiKey;
      emailService.sendGridApiKey = emailSettings.sendGridApiKey;
      emailService.fromEmail = emailSettings.emailFromAddress;
      emailService.fromName = emailSettings.emailFromName;

      try {
        await emailService.sendInvitationEmail(
          { email: testEmail, name: 'Test User' },
          { name: 'Test Manager', companyName: 'Test Company' },
          'test-token-123'
        );

        setSuccess('Test email sent successfully via SendGrid!');
        setTestEmail('');
      } finally {
        // Restore original settings
        emailService.sendGridApiKey = originalKey;
      }
    } catch (error) {
      setError('Failed to send test email: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handlePreviewEmail = () => {
    try {
      const previewData = {
        companyName: 'Sample Company',
        inviterName: 'John Manager',
        employeeName: 'Jane Employee',
        loginUrl: 'http://localhost:3000/login',
        token: 'sample-token',
        expiryDate: 'December 31, 2024'
      };

      const preview = emailService.generateEmailPreview(previewType, previewData);
      setEmailPreview(preview);
    } catch (error) {
      setError('Failed to generate email preview: ' + error.message);
    }
  };

  const handleLoadEmailStats = async () => {
    try {
      if (!emailSettings.sendGridApiKey) {
        setError('Please configure SendGrid API key first');
        return;
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days

      // Temporarily set the API key
      const originalKey = emailService.sendGridApiKey;
      emailService.sendGridApiKey = emailSettings.sendGridApiKey;

      try {
        const stats = await emailService.getEmailStatistics(startDate, endDate);
        setEmailStats(stats);
      } finally {
        emailService.sendGridApiKey = originalKey;
      }
    } catch (error) {
      setError('Failed to load email statistics: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading email settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📧 Email Settings</h1>
            <p className="text-gray-600 mt-2">Configure SendGrid email delivery and templates</p>
          </div>
          <HomeButton />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* SendGrid Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 SendGrid Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SendGrid API Key</label>
                <input
                  type="password"
                  value={emailSettings.sendGridApiKey}
                  onChange={(e) => setEmailSettings({...emailSettings, sendGridApiKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SG.xxxxx..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get your API key from SendGrid Dashboard → Settings → API Keys
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">SendGrid Status</span>
                  <p className="text-sm text-gray-500">
                    {emailSettings.sendGridConfig.validated ? 
                      `✅ Validated on ${new Date(emailSettings.sendGridConfig.lastValidated).toLocaleDateString()}` : 
                      '❌ Not validated'
                    }
                  </p>
                </div>
                <button
                  onClick={() => validateSendGridKey(emailSettings.sendGridApiKey)}
                  disabled={!emailSettings.sendGridApiKey}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Validate API Key
                </button>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Invitation Emails</label>
                  <p className="text-sm text-gray-500">Send emails when employees are invited</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailSettings.enableInvitationEmails}
                  onChange={(e) => setEmailSettings({...emailSettings, enableInvitationEmails: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Welcome Emails</label>
                  <p className="text-sm text-gray-500">Send welcome emails when employees join</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailSettings.enableWelcomeEmails}
                  onChange={(e) => setEmailSettings({...emailSettings, enableWelcomeEmails: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Password Reset Emails</label>
                  <p className="text-sm text-gray-500">Send password reset links</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailSettings.enablePasswordResetEmails}
                  onChange={(e) => setEmailSettings({...emailSettings, enablePasswordResetEmails: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notification Emails</label>
                  <p className="text-sm text-gray-500">Send system notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailSettings.enableNotificationEmails}
                  onChange={(e) => setEmailSettings({...emailSettings, enableNotificationEmails: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Email Sender Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Sender Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text"
                  value={emailSettings.emailFromName}
                  onChange={(e) => setEmailSettings({...emailSettings, emailFromName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Workforce Management"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address</label>
                <input
                  type="email"
                  value={emailSettings.emailFromAddress}
                  onChange={(e) => setEmailSettings({...emailSettings, emailFromAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="noreply@workforce.com"
                />
              </div>
            </div>
          </div>

          {/* Email Testing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Testing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Email Address</label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="test@example.com"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={testing || !emailSettings.sendGridConfig.validated}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {testing ? 'Sending...' : 'Send Test Email'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Preview</label>
                <div className="flex space-x-2">
                  <select
                    value={previewType}
                    onChange={(e) => setPreviewType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="invitation">Invitation Email</option>
                    <option value="welcome">Welcome Email</option>
                    <option value="passwordReset">Password Reset Email</option>
                  </select>
                  <button
                    onClick={handlePreviewEmail}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Generate Preview
                  </button>
                </div>
              </div>

              {emailPreview && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Subject: {emailPreview.subject}</h3>
                  <div className="bg-gray-50 p-4 rounded text-sm">
                    <div dangerouslySetInnerHTML={{ __html: emailPreview.html }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📊 Email Statistics</h2>
              <button
                onClick={handleLoadEmailStats}
                disabled={!emailSettings.sendGridConfig.validated}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Load Statistics
              </button>
            </div>
            
            {emailStats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{emailStats.requests || 0}</div>
                  <div className="text-sm text-gray-600">Total Sent</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{emailStats.delivered || 0}</div>
                  <div className="text-sm text-gray-600">Delivered</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{emailStats.opens || 0}</div>
                  <div className="text-sm text-gray-600">Opened</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{emailStats.clicks || 0}</div>
                  <div className="text-sm text-gray-600">Clicked</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Click "Load Statistics" to view SendGrid email analytics
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;
