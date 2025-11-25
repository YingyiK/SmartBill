import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Key, Mail, Bell, Shield } from "lucide-react";

export default function Settings() {
  const [ocrProvider, setOcrProvider] = useState("tesseract");
  const [activeTab, setActiveTab] = useState("api");
  const [llmProvider, setLlmProvider] = useState("openai");
  const [sttProvider, setSttProvider] = useState("whisper");
  const [ocrApiKey, setOcrApiKey] = useState("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [sttApiKey, setSttApiKey] = useState("");
  
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [emailUsername, setEmailUsername] = useState("");
  const [emailPassword, setEmailPassword] = useState("");


  const [expenseCreated, setExpenseCreated] = useState(true);
  const [expenseSplit, setExpenseSplit] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);


  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  const renderAPIConfiguration = () => (
    <div className="settings-section">
      <h3>API Configuration</h3>
      
      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div>
          <strong>Important</strong>
          <p>These API keys are required for OCR, LLM, and Speech-to-Text features. Your keys are stored securely and never shared.</p>
        </div>
      </div>

      {/* OCR Provider */}
      <div className="provider-section">
        <h4>📄 OCR Provider</h4>
        
        <div className="provider-options">
          <label className={`provider-card ${ocrProvider === 'tesseract' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="ocr"
              value="tesseract"
              checked={ocrProvider === 'tesseract'}
              onChange={(e) => setOcrProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">Tesseract OCR</div>
              <div className="provider-desc">Open source, free</div>
            </div>
          </label>

          <label className={`provider-card ${ocrProvider === 'paddle' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="ocr"
              value="paddle"
              checked={ocrProvider === 'paddle'}
              onChange={(e) => setOcrProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">PaddleOCR</div>
              <div className="provider-desc">High accuracy</div>
            </div>
          </label>
        </div>

        <div className="input-group">
          <label>API Key (if required)</label>
          <input
            type="text"
            placeholder="Enter OCR API key"
            value={ocrApiKey}
            onChange={(e) => setOcrApiKey(e.target.value)}
            className="settings-input"
          />
        </div>
      </div>

      {/* LLM Provider */}
      <div className="provider-section">
        <h4>🤖 LLM Provider</h4>
        
        <div className="provider-options">
          <label className={`provider-card ${llmProvider === 'openai' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="llm"
              value="openai"
              checked={llmProvider === 'openai'}
              onChange={(e) => setLlmProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">OpenAI GPT</div>
              <div className="provider-desc">Most popular</div>
            </div>
          </label>

          <label className={`provider-card ${llmProvider === 'claude' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="llm"
              value="claude"
              checked={llmProvider === 'claude'}
              onChange={(e) => setLlmProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">Claude</div>
              <div className="provider-desc">Anthropic</div>
            </div>
          </label>
        </div>

        <div className="input-group">
          <label>API Key *</label>
          <input
            type="password"
            placeholder="sk-..."
            value={llmApiKey}
            onChange={(e) => setLlmApiKey(e.target.value)}
            className="settings-input"
          />
        </div>
      </div>

      {/* Speech-to-Text Provider */}
      <div className="provider-section">
        <h4>🎤 Speech-to-Text Provider</h4>
        
        <div className="provider-options">
          <label className={`provider-card ${sttProvider === 'whisper' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="stt"
              value="whisper"
              checked={sttProvider === 'whisper'}
              onChange={(e) => setSttProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">Whisper</div>
            </div>
          </label>

          <label className={`provider-card ${sttProvider === 'google' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="stt"
              value="google"
              checked={sttProvider === 'google'}
              onChange={(e) => setSttProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">Google</div>
            </div>
          </label>

          <label className={`provider-card ${sttProvider === 'azure' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="stt"
              value="azure"
              checked={sttProvider === 'azure'}
              onChange={(e) => setSttProvider(e.target.value)}
            />
            <div>
              <div className="provider-name">Azure</div>
            </div>
          </label>
        </div>

        <div className="input-group">
          <label>API Key *</label>
          <input
            type="password"
            placeholder="Enter Speech-to-Text API key"
            value={sttApiKey}
            onChange={(e) => setSttApiKey(e.target.value)}
            className="settings-input"
          />
        </div>
      </div>

      <div className="save-button-container">
        <button className="btn save-btn" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );


  const renderEmailSettings = () => (
    <div className="settings-section">
      <h3>Email Settings</h3>
      
      <div className="input-group">
        <label>Email Provider</label>
        <select 
          className="settings-input"
          value={emailProvider}
          onChange={(e) => setEmailProvider(e.target.value)}
        >
          <option value="smtp">SMTP</option>
          <option value="sendgrid">SendGrid</option>
          <option value="mailgun">Mailgun</option>
        </select>
      </div>

      <div className="input-row">
        <div className="input-group" style={{ flex: 2 }}>
          <label>SMTP Host</label>
          <input
            type="text"
            placeholder="smtp.gmail.com"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            className="settings-input"
          />
        </div>

        <div className="input-group" style={{ flex: 1 }}>
          <label>Port</label>
          <input
            type="text"
            placeholder="587"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            className="settings-input"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Username</label>
        <input
          type="email"
          placeholder="your-email@example.com"
          value={emailUsername}
          onChange={(e) => setEmailUsername(e.target.value)}
          className="settings-input"
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={emailPassword}
          onChange={(e) => setEmailPassword(e.target.value)}
          className="settings-input"
        />
      </div>

      <div className="save-button-container">
        <button className="btn save-btn" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );

  // Notifications
  const renderNotifications = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      
      <div className="notification-card">
        <div>
          <div className="notification-title">Expense Created</div>
          <div className="notification-desc">Notify when a new expense is created</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={expenseCreated}
            onChange={(e) => setExpenseCreated(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="notification-card">
        <div>
          <div className="notification-title">Expense Split</div>
          <div className="notification-desc">Notify when expenses are split and assigned</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={expenseSplit}
            onChange={(e) => setExpenseSplit(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="notification-card">
        <div>
          <div className="notification-title">Payment Received</div>
          <div className="notification-desc">Notify when a payment is received (future feature)</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={paymentReceived}
            onChange={(e) => setPaymentReceived(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="notification-card">
        <div>
          <div className="notification-title">Browser Notifications</div>
          <div className="notification-desc">Enable desktop notifications</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={browserNotifications}
            onChange={(e) => setBrowserNotifications(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="save-button-container">
        <button className="btn save-btn" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );

  // Security
  const renderSecurity = () => (
    <div className="settings-section">
      <h3>Security Settings</h3>
      
      <div className="security-info-box">
        <div className="security-check-icon">✓</div>
        <div>
          <div className="security-title">Secure Connection</div>
          <div className="security-desc">All data is encrypted using HTTPS. Your API keys and sensitive information are stored securely.</div>
        </div>
      </div>

      <div className="security-card">
        <div className="security-card-header">
          <div className="security-card-title">Data Encryption</div>
        </div>
        <div className="security-card-body">
          All sensitive data is encrypted at rest and in transit
        </div>
        <div className="security-status">
          <span className="status-icon">✓</span>
          <span className="status-text">Enabled</span>
        </div>
      </div>

      <div className="security-card">
        <div className="security-card-header">
          <div className="security-card-title">Privacy Protection</div>
        </div>
        <div className="security-card-body">
          Only expense participants can view their share details
        </div>
        <div className="security-status">
          <span className="status-icon">✓</span>
          <span className="status-text">Enabled</span>
        </div>
      </div>

      <div className="security-card warning">
        <div className="security-card-header">
          <div className="security-card-title">Important Notice</div>
        </div>
        <div className="security-card-body">
          SmartBill is not designed for collecting Personally Identifiable Information (PII) or securing highly sensitive data. Use appropriate enterprise solutions for handling sensitive information.
        </div>
      </div>

      <div className="save-button-container">
        <button className="btn save-btn" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );

  return (
    <main className="main">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="subtext">Configure your SmartBill application</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div 
            className={`settings-nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Key size={18} />
            API Configuration
          </div>
          <div 
            className={`settings-nav-item ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail size={18} />
            Email Settings
          </div>
          <div 
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} />
            Notifications
          </div>
          <div 
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            Security
          </div>
        </aside>

        <div className="settings-content">
          {activeTab === 'api' && renderAPIConfiguration()}
          {activeTab === 'email' && renderEmailSettings()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>
    </main>
  );
}