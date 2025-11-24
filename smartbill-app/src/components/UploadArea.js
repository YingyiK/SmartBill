import React from 'react';
import { Upload } from 'lucide-react';
import './UploadArea.css';

const UploadArea = ({ onFileSelect, selectedFile }) => (
  <div className="upload-container">
    <div className="upload-content">
      <div className="upload-icon-wrapper">
        <Upload className="upload-icon" size={32} />
      </div>
      
      <h3 className="upload-title">
        Upload Your Bill
      </h3>
      
      <p className="upload-description">
        Take a photo or upload an image of your receipt
      </p>

      <label className="upload-button-wrapper">
        <input
          type="file"
          className="upload-input"
          accept="image/*"
          onChange={onFileSelect}
        />
        <div className="upload-button">
          <Upload size={20} />
          Choose Image
        </div>
      </label>

      {selectedFile && (
        <p className="upload-filename">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  </div>
);

export default UploadArea;