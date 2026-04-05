import { emailTemplates } from './emailTemplates';

class EmailService {
  constructor() {
    this.apiBase = process.env.REACT_APP_API_BASE_URL || 'https://fieldsync-backend.onrender.com/api';
    this.sendGridApiKey = process.env.REACT_APP_SENDGRID_API_KEY;
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@workforce.com';
    this.fromName = process.env.REACT_APP_FROM_NAME || 'Workforce Management';
  }

  // Send email using SendGrid API via backend proxy
  async sendEmailWithSendGrid(to, subject, htmlContent, textContent) {
    try {
      // Route through backend to avoid CORS issues
      const emailData = {
        to: to,
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent,
        fromEmail: this.fromEmail,
        fromName: this.fromName
      };

      const response = await fetch(`${this.apiBase}/emails/send-via-sendgrid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Email service error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      throw error;
    }
  }

  // Send invitation email via SendGrid
  async sendInvitationEmail(employeeData, inviterData, invitationToken) {
    try {
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const subject = emailTemplates.invitation.subject;
      const htmlContent = emailTemplates.invitation.html(
        inviterData.companyName || 'Our Company',
        inviterData.name || 'Your Manager',
        invitationToken,
        formattedExpiry
      );
      const textContent = emailTemplates.invitation.text(
        inviterData.companyName || 'Our Company',
        inviterData.name || 'Your Manager',
        invitationToken,
        formattedExpiry
      );

      // Send via SendGrid
      const result = await this.sendEmailWithSendGrid(
        employeeData.email,
        subject,
        htmlContent,
        textContent
      );

      // Log the invitation for tracking
      await this.logEmailActivity({
        type: 'invitation',
        to: employeeData.email,
        employeeId: employeeData.id,
        inviterId: inviterData.id,
        invitationToken,
        messageId: result.messageId,
        status: 'sent'
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Send welcome email via SendGrid
  async sendWelcomeEmail(employeeData, temporaryPassword = null) {
    try {
      const loginUrl = `${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/login`;

      const subject = emailTemplates.welcome.subject;
      const htmlContent = emailTemplates.welcome.html(
        employeeData.name,
        employeeData.companyName || 'Our Company',
        loginUrl,
        temporaryPassword
      );
      const textContent = emailTemplates.welcome.text(
        employeeData.name,
        employeeData.companyName || 'Our Company',
        loginUrl,
        temporaryPassword
      );

      // Send via SendGrid
      const result = await this.sendEmailWithSendGrid(
        employeeData.email,
        subject,
        htmlContent,
        textContent
      );

      // Log the welcome email for tracking
      await this.logEmailActivity({
        type: 'welcome',
        to: employeeData.email,
        employeeId: employeeData.id,
        temporaryPassword: !!temporaryPassword,
        messageId: result.messageId,
        status: 'sent'
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Send password reset email via SendGrid
  async sendPasswordResetEmail(employeeData, resetToken) {
    try {
      const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subject = emailTemplates.passwordReset.subject;
      const htmlContent = emailTemplates.passwordReset.html(
        employeeData.name,
        resetToken,
        formattedExpiry
      );
      const textContent = emailTemplates.passwordReset.text(
        employeeData.name,
        resetToken,
        formattedExpiry
      );

      // Send via SendGrid
      const result = await this.sendEmailWithSendGrid(
        employeeData.email,
        subject,
        htmlContent,
        textContent
      );

      // Log the password reset email for tracking
      await this.logEmailActivity({
        type: 'password_reset',
        to: employeeData.email,
        employeeId: employeeData.id,
        resetToken,
        messageId: result.messageId,
        status: 'sent'
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Send bulk invitation emails via SendGrid
  async sendBulkInvitations(invitations, inviterData) {
    try {
      const results = [];
      
      for (const invitation of invitations) {
        try {
          const result = await this.sendInvitationEmail(
            invitation.employeeData,
            inviterData,
            invitation.token
          );
          results.push({
            email: invitation.employeeData.email,
            status: 'success',
            messageId: result.messageId,
            message: 'Invitation sent successfully'
          });
        } catch (error) {
          results.push({
            email: invitation.employeeData.email,
            status: 'error',
            message: error.message
          });
        }
      }

      return {
        total: invitations.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      };
    } catch (error) {
      throw error;
    }
  }

  // Check email delivery status via SendGrid
  async checkEmailDeliveryStatus(messageId) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check email delivery status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get SendGrid email statistics
  async getEmailStatistics(startDate, endDate) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`, {
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get email statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Log email activity for tracking
  async logEmailActivity(activityData) {
    try {
      const response = await fetch(`${this.apiBase}/emails/log-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(activityData)
      });

      if (!response.ok) {
        // Silently handle logging errors in production
      }
    } catch (error) {
      // Silently handle logging errors in production
    }
  }

  // Get SendGrid templates (if using template management)
  async getSendGridTemplates() {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/templates', {
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get SendGrid templates: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Generate email preview (unchanged)
  generateEmailPreview(templateType, data) {
    try {
      const template = emailTemplates[templateType];
      if (!template) {
        throw new Error(`Email template '${templateType}' not found`);
      }

      switch (templateType) {
        case 'invitation':
          return {
            subject: template.subject,
            html: template.html(
              data.companyName || 'Sample Company',
              data.inviterName || 'John Manager',
              data.token || 'sample-token',
              data.expiryDate || 'December 31, 2024'
            ),
            text: template.text(
              data.companyName || 'Sample Company',
              data.inviterName || 'John Manager',
              data.token || 'sample-token',
              data.expiryDate || 'December 31, 2024'
            )
          };

        case 'welcome':
          return {
            subject: template.subject,
            html: template.html(
              data.employeeName || 'Jane Employee',
              data.companyName || 'Sample Company',
              data.loginUrl || 'http://localhost:3000/login',
              data.temporaryPassword || 'TempPass123!'
            ),
            text: template.text(
              data.employeeName || 'Jane Employee',
              data.companyName || 'Sample Company',
              data.loginUrl || 'http://localhost:3000/login',
              data.temporaryPassword || 'TempPass123!'
            )
          };

        case 'passwordReset':
          return {
            subject: template.subject,
            html: template.html(
              data.employeeName || 'Jane Employee',
              data.token || 'sample-reset-token',
              data.expiryDate || 'December 31, 2024 at 11:59 PM'
            ),
            text: template.text(
              data.employeeName || 'Jane Employee',
              data.token || 'sample-reset-token',
              data.expiryDate || 'December 31, 2024 at 11:59 PM'
            )
          };

        default:
          throw new Error(`Unknown template type: ${templateType}`);
      }
    } catch (error) {
      console.error('Email service error (preview):', error);
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
