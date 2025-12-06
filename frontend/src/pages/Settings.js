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

  // 可复用的 Toggle Switch 组件
  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <span className="text-gray-900 font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange} 
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  const renderAPIConfiguration = () => (
    <div className="space-y-6"> {/* .settings-section */}
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">API Configuration</h3>
      
      <div className="flex items-start gap-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-blue-800"> {/* .info-box */}
        <div className="text-xl flex-shrink-0">ℹ️</div> {/* .info-icon */}
        <div>
          <strong className="font-semibold">Important</strong>
          <p className="text-sm">These API keys are required for OCR, LLM, and Speech-to-Text features. Your keys are stored securely and never shared.</p>
        </div>
      </div>

      {/* OCR Provider */}
      <div className="space-y-4"> {/* .provider-section */}
        <h4 className="text-xl font-medium pt-4 border-t border-gray-200 text-gray-800">📄 OCR Provider</h4>
        
        <div className="flex flex-wrap gap-4"> {/* .provider-options */}
          <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all w-full md:w-auto ${ocrProvider === 'tesseract' ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}> {/* .provider-card & .selected */}
            <input
              type="radio"
              name="ocr"
              value="tesseract"
              checked={ocrProvider === 'tesseract'}
              onChange={(e) => setOcrProvider(e.target.value)}
              className="form-radio text-blue-600"
            />
            <div>
              <div className="font-semibold text-gray-800">Tesseract OCR</div> {/* .provider-name */}
              <div className="text-sm text-gray-500">Open source, free</div> {/* .provider-desc */}
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all w-full md:w-auto ${ocrProvider === 'paddle' ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}> {/* .provider-card & .selected */}
            <input
              type="radio"
              name="ocr"
              value="paddle"
              checked={ocrProvider === 'paddle'}
              onChange={(e) => setOcrProvider(e.target.value)}
              className="form-radio text-blue-600"
            />
            <div>
              <div className="font-semibold text-gray-800">Paddle OCR</div>
              <div className="text-sm text-gray-500">Baidu's powerful OCR</div>
            </div>
          </label>
        </div>
      </div>
      
      {/* API Keys */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1"> {/* .input-group */}
            <label htmlFor="ocrKey" className="block text-sm font-medium text-gray-700">OCR API Key</label>
            <input 
              id="ocrKey" 
              type="password" 
              value={ocrApiKey} 
              onChange={(e) => setOcrApiKey(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              placeholder="Enter key"
            />
          </div>
          {/* ... other key inputs follow similar pattern ... */}
          <div className="space-y-1">
            <label htmlFor="llmKey" className="block text-sm font-medium text-gray-700">LLM API Key</label>
            <input 
              id="llmKey" 
              type="password" 
              value={llmApiKey} 
              onChange={(e) => setLlmApiKey(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              placeholder="Enter key"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sttKey" className="block text-sm font-medium text-gray-700">STT API Key</label>
            <input 
              id="sttKey" 
              type="password" 
              value={sttApiKey} 
              onChange={(e) => setSttApiKey(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              placeholder="Enter key"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t mt-6"> {/* .action-button-group */}
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        > {/* .save-button */}
          Save API Settings
        </button>
      </div>
    </div>
  );
  
  const renderEmailSettings = () => (
    <div className="space-y-6"> {/* .settings-section */}
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">Email Settings</h3>
      {/* ... email provider and SMTP settings use similar input/provider styles ... */}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6"> {/* .settings-section */}
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">Notifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleSwitch 
          label="Expense Created" 
          checked={expenseCreated} 
          onChange={() => setExpenseCreated(!expenseCreated)}
        />
        <ToggleSwitch 
          label="Expense Split" 
          checked={expenseSplit} 
          onChange={() => setExpenseSplit(!expenseSplit)}
        />
        <ToggleSwitch 
          label="Payment Received" 
          checked={paymentReceived} 
          onChange={() => setPaymentReceived(!paymentReceived)}
        />
        <ToggleSwitch 
          label="Browser Notifications" 
          checked={browserNotifications} 
          onChange={() => setBrowserNotifications(!browserNotifications)}
        />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6"> {/* .settings-section */}
      <h3 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-800">Security</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4"> {/* .security-card */}
          <div className="flex justify-between items-center"> {/* .security-card-header */}
            <div className="text-lg font-semibold text-gray-900">Multi-Factor Auth</div> {/* .security-card-title */}
            <Shield size={24} className="text-blue-500" />
          </div>
          <div className="text-sm text-gray-600">
            Increase security by requiring a second verification step.
          </div> {/* .security-card-body (text part) */}
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Enable MFA
          </button>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4"> {/* .security-card */}
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-900">Data Encryption</div>
            <Shield size={24} className="text-green-500" />
          </div>
          <div className="text-sm text-gray-600">
            All sensitive data is encrypted at rest and in transit.
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="mb-8"> {/* .settings-header */}
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-base text-gray-500">Configure your SmartBill application</p> {/* .subtext */}
      </div>

      <div className="flex flex-col lg:flex-row gap-8"> {/* .settings-layout */}
        <aside className="lg:w-64 space-y-2 p-4 bg-white rounded-xl shadow-sm h-fit"> {/* .settings-sidebar */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'api' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('api')}
          > {/* .settings-nav-item & .active */}
            <Key size={18} />
            API Configuration
          </div>
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'email' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail size={18} />
            Email Settings
          </div>
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'notifications' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} />
            Notifications
          </div>
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'security' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            Security
          </div>
        </aside>

        <div className="flex-1"> {/* .settings-content */}
          {activeTab === 'api' && renderAPIConfiguration()}
          {activeTab === 'email' && renderEmailSettings()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>
    </main>
  );
}