// UploadArea.js
import React from 'react';
import { Upload } from 'lucide-react';

const UploadArea = ({ onFileSelect, selectedFile }) => (
  <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-16">
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
        <Upload size={32} />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Bill</h3>

      <p className="text-base text-gray-500 mb-8">Take a photo or upload an image of your receipt</p>

      <label className="cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={onFileSelect}
        />
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-base">
          <Upload size={20} />
          Choose Image
        </div>
      </label>

      {selectedFile && (
        <p className="text-sm text-gray-500 mt-4">Selected: {selectedFile.name}</p>
      )}
    </div>
  </div>
);

export default UploadArea;