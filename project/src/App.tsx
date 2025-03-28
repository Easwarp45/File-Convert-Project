import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { FileUp, FileDown, Image as ImageIcon } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToPDF = async () => {
    if (!selectedFile) return;
    
    const img = new Image();
    img.src = preview;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
    const width = img.width * ratio;
    const height = img.height * ratio;
    
    pdf.addImage(preview, 'JPEG', 
      (pdfWidth - width) / 2, 
      (pdfHeight - height) / 2, 
      width, 
      height
    );
    
    pdf.save('converted-image.pdf');
  };

  const convertToWord = async () => {
    if (!selectedFile) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: await fetch(preview).then(r => r.arrayBuffer()),
                transformation: {
                  width: 500,
                  height: 400,
                },
              }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted-image.docx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToPowerPoint = async () => {
    if (!selectedFile) return;

    const pptx = new pptxgen();
    const slide = pptx.addSlide();
    
    slide.addImage({
      data: preview,
      x: 1,
      y: 1,
      w: 8,
      h: 5.5,
    });

    await pptx.writeFile('converted-image.pptx');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Image Converter
          </h1>

          <div className="mb-8">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div className="space-y-4">
                  <FileUp className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500">
                    Click to upload or drag and drop an image
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={convertToPDF}
                className="flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
              >
                <FileDown className="w-5 h-5" />
                Convert to PDF
              </button>
              <button
                onClick={convertToWord}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FileDown className="w-5 h-5" />
                Convert to Word
              </button>
              <button
                onClick={convertToPowerPoint}
                className="flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FileDown className="w-5 h-5" />
                Convert to PowerPoint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;