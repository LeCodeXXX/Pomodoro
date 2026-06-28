import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, BookOpen, BrainCircuit, MoreVertical, X, File as FileIcon, Loader2, Download } from 'lucide-react';
import { PDFViewer } from '../components/PDFViewer';
import { TextViewer } from '../components/TextViewer';
import { LoadingScreen } from '../components/LoadingScreen';
import { AlertModal } from '../components/AlertModal';

interface Material {
  id: string;
  name: string;
  type: string;
  dateAdded: string;
  size?: string;
  url?: string;
}

interface StudyMaterialPageProps {
  user: any;
}

export function StudyMaterialPage({ user }: StudyMaterialPageProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:3000/api/documents', {
        headers: { 'x-user-id': user.id }
      });
      const data = await response.json();
      if (response.ok) {
        const fetchedMaterials = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.title,
          type: doc.fileUrl.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          dateAdded: new Date(doc.createdAt).toLocaleDateString(),
          url: `http://localhost:3000${doc.fileUrl}`,
          size: 'Unknown'
        }));
        setMaterials(fetchedMaterials);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('http://localhost:3000/api/documents/upload', {
          method: 'POST',
          headers: { 'x-user-id': user.id },
          body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
          const doc = data.document;
          const newMaterial: Material = {
            id: doc.id,
            name: doc.title,
            type: doc.fileUrl.split('.').pop()?.toUpperCase() || 'UNKNOWN',
            dateAdded: 'Just now',
            url: `http://localhost:3000${doc.fileUrl}`,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          };
          setMaterials([newMaterial, ...materials]);
          setSelectedMaterial(newMaterial);
        } else {
          console.error('Upload failed:', data.error);
          setUploadError(data.error || 'Failed to upload document. Please try again.');
        }
      } catch (error) {
        console.error('Failed to upload material:', error);
        setUploadError('A network error occurred while uploading. Please try again.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <>
      <AlertModal 
        isOpen={!!uploadError} 
        onClose={() => setUploadError(null)} 
        title="Upload Failed" 
        message={uploadError || ''} 
      />
      <div className="w-full h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto overflow-hidden relative">
        <LoadingScreen isLoading={isUploading} message="Uploading and processing your document..." fullScreen={true} />
      
      {/* Sidebar - Materials Library */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`flex flex-col gap-4 bg-[#141414] border border-white/5 rounded-[15px] p-5 overflow-hidden transition-all duration-300 ${selectedMaterial ? 'w-full md:w-80 hidden md:flex' : 'w-full'} shadow-2xl`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            Library
          </h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !user}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-300 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
        </div>

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden" 
          accept=".pdf,.docx,.txt"
        />

        <div className="relative mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2 custom-scrollbar">
          {filteredMaterials.map((material) => (
            <button
              key={material.id}
              onClick={() => setSelectedMaterial(material)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${selectedMaterial?.id === material.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${selectedMaterial?.id === material.id ? 'text-white' : 'text-gray-300'}`}>{material.name}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-medium text-gray-500">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{material.type}</span>
                  <span>{material.dateAdded}</span>
                </div>
              </div>
            </button>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No materials found.
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content - Document Viewer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-[#141414] border border-white/5 rounded-[15px] flex flex-col overflow-hidden relative shadow-2xl"
      >
        {selectedMaterial ? (
          <>
            {/* Viewer Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1a1a]/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="md:hidden p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="truncate max-w-[200px] sm:max-w-md text-white font-medium">{selectedMaterial.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold tracking-wide transition-all border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="hidden sm:inline">GENERATE QUIZ</span>
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actual Viewer Content — fills remaining space; PDFViewer fills this absolutely */}
            <div className="flex-1 relative" style={{ minHeight: 0 }}>
              <div style={{ position: 'absolute', inset: 0 }} className="bg-[#0a0a0a]">
                {selectedMaterial.type === 'PDF' ? (
                  <PDFViewer key={selectedMaterial.id} url={selectedMaterial.url!} title={selectedMaterial.name} />
                ) : selectedMaterial.type === 'TXT' ? (
                  <TextViewer key={selectedMaterial.id} url={selectedMaterial.url!} title={selectedMaterial.name} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/5">
                      <FileIcon className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Document Preview Unavailable</h3>
                    <p className="text-gray-400 mb-8 max-w-sm">This file format ({selectedMaterial.type}) cannot be previewed directly in the browser.</p>
                    <a
                      href={selectedMaterial.url}
                      download={selectedMaterial.name}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium border border-white/10 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download to view
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-transparent to-[#0a0a0a]/50">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/5">
              <BookOpen className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-medium text-white mb-3">Select a material to study</h3>
            <p className="text-gray-500 max-w-md mb-10 leading-relaxed">
              Upload a PDF, DOCX, or TXT file to start reading. Your focus timer will remain visible while you study so you never lose track of time.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !user}
              className="flex items-center gap-3 px-8 py-4 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isUploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
    </>
  );
}
