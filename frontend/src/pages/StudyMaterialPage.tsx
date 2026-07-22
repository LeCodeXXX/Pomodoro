import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, BookOpen, MoreVertical, File as FileIcon, Loader2, Download, ArrowLeft, Sparkles } from 'lucide-react';
import { getAuthHeader } from '../utils/auth';
import { apiUrl } from '../utils/api';
import { PDFViewer } from '../components/PDFViewer';
import { TextViewer } from '../components/TextViewer';
import { LoadingScreen } from '../components/LoadingScreen';
import { AlertModal } from '../components/AlertModal';
import { QuizModal } from '../components/QuizModal';
import { QuizSetupModal, type QuizSettings } from '../components/QuizSetupModal';
import { QuizHistoryModal } from '../components/QuizHistoryModal';

interface Material {
  id: string;
  name: string;
  type: string;
  dateAdded: string;
  size?: string;
  url?: string;
}

interface SavedQuiz {
  id: string;
  title: string;
  label: string;
  difficulty: string;
  questionType: string;
  totalQuestions: number;
  createdAt: string;
  questions: any[];
  metadata?: any;
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
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isQuizSetupOpen, setIsQuizSetupOpen] = useState(false);
  const [isQuizHistoryOpen, setIsQuizHistoryOpen] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [isLoadingSavedQuizzes, setIsLoadingSavedQuizzes] = useState(false);
  const [savedQuizError, setSavedQuizError] = useState<string | null>(null);
  const [isAIServiceHealthy, setIsAIServiceHealthy] = useState<boolean | null>(null);

  const checkAIServiceHealth = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/quiz/health'), {
        method: 'GET',
        headers: { ...getAuthHeader() },
      })

      if (!res.ok) {
        setIsAIServiceHealthy(false);
        throw new Error(`Health check failed with status ${res.status}`);
      }

      setIsAIServiceHealthy(true);
    } catch (error) {
      console.error('Error checking AI service health:', error)
      setIsAIServiceHealthy(false)
    }
  }, [])

  const fetchMaterials = async () => {
    if (!user) return;
    try {
      const response = await fetch(apiUrl('/api/documents'), {
        headers: { ...getAuthHeader() }
      });
      const data = await response.json();
      if (response.ok) {
        const fetchedMaterials = data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.title,
          type: doc.fileUrl.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          dateAdded: new Date(doc.createdAt).toLocaleDateString(),
          url: apiUrl(doc.fileUrl),
          size: 'Unknown'
        }));
        setMaterials(fetchedMaterials);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkAIServiceHealth();
      fetchMaterials();
    }
  }, [user]);

  useEffect(() => {
    const loadSavedQuizzes = async () => {
      if (!user || !selectedMaterial || !isQuizHistoryOpen) {
        return;
      }

      setIsLoadingSavedQuizzes(true);
      setSavedQuizError(null);

      try {
        const response = await fetch(apiUrl(`/api/quiz/document/${selectedMaterial.id}`), {
          headers: { ...getAuthHeader() },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load saved quizzes.');
        }

        setSavedQuizzes(data.quizzes || []);
      } catch (error: any) {
        console.error('Failed to fetch saved quizzes:', error);
        setSavedQuizError(error.message || 'Failed to load saved quizzes.');
      } finally {
        setIsLoadingSavedQuizzes(false);
      }
    };

    loadSavedQuizzes();
  }, [isQuizHistoryOpen, selectedMaterial, user]);

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenQuizSetup = () => {
    if (!user) {
      setQuizError('Please sign in before generating a quiz.');
      return;
    }

    if (!selectedMaterial) {
      setQuizError('Select a study material before generating a quiz.');
      return;
    }

    setIsQuizSetupOpen(true);
  };

  const handleOpenQuizHistory = () => {
    if (!user) {
      setQuizError('Please sign in before opening quiz history.');
      return;
    }

    if (!selectedMaterial) {
      setQuizError('Select a study material before opening quiz history.');
      return;
    }

    setIsQuizHistoryOpen(true);
  };

  const handleSelectSavedQuiz = (quiz: SavedQuiz) => {
    setIsQuizHistoryOpen(false);
    setQuizResult(quiz);
    setIsQuizOpen(true);
  };

  const handleGenerateQuiz = async (settings: QuizSettings) => {
    if (!user || !selectedMaterial) {
      setQuizError('Select a study material before generating a quiz.');
      return;
    }

    setIsQuizSetupOpen(false);
    setIsGeneratingQuiz(true);
    setQuizError(null);

    try {
      const formData = new FormData();
      formData.append('documentId', selectedMaterial.id);
      formData.append('difficulty', settings.difficulty);
      formData.append('questionType', settings.questionType);
      formData.append('numQuestions', String(settings.numQuestions));
      formData.append('quizLabel', settings.quizLabel || selectedMaterial.name);
      if (settings.focusTopics.trim()) {
        formData.append('focusTopics', settings.focusTopics.trim());
      }

      const response = await fetch(apiUrl('/api/quiz/generate'), {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate quiz.');
      }

      setQuizResult(data);
      setIsQuizOpen(true);
    } catch (error: any) {
      console.error('Failed to generate quiz:', error);
      setQuizError(error.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(apiUrl('/api/documents/upload'), {
          method: 'POST',
          headers: { ...getAuthHeader() },
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
            url: apiUrl(doc.fileUrl),
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
      <AlertModal
        isOpen={!!quizError}
        onClose={() => setQuizError(null)}
        title="Quiz Generation Failed"
        message={quizError || ''}
      />
      <QuizSetupModal
        isOpen={isQuizSetupOpen}
        onClose={() => setIsQuizSetupOpen(false)}
        onGenerate={handleGenerateQuiz}
        defaultLabel={selectedMaterial?.name || 'Study Quiz'}
      />
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        quiz={quizResult}
        userId={user?.id}
      />
      <QuizHistoryModal
        isOpen={isQuizHistoryOpen}
        onClose={() => setIsQuizHistoryOpen(false)}
        materialName={selectedMaterial?.name || 'Study material'}
        quizzes={savedQuizzes}
        isLoading={isLoadingSavedQuizzes}
        error={savedQuizError}
        onSelectQuiz={handleSelectSavedQuiz}
        onGenerateNewQuiz={() => {
          setIsQuizHistoryOpen(false);
          handleOpenQuizSetup();
        }}
      />
      <div className="w-full h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6 p-2 sm:p-6 max-w-7xl mx-auto overflow-hidden relative">
        <LoadingScreen isLoading={isUploading} message="Uploading and processing your document..." fullScreen={true} />
        <LoadingScreen isLoading={isGeneratingQuiz} message="Generating your quiz..." fullScreen={true} />
      
      {/* Sidebar - Materials Library */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`flex flex-col gap-4 bg-transparent md:bg-[#141414] border-0 md:border md:border-white/5 rounded-none md:rounded-[15px] p-2 sm:p-5 overflow-hidden transition-all duration-300 ${selectedMaterial ? 'w-full md:w-80 hidden md:flex' : 'w-full flex-1 md:flex-initial'} shadow-none md:shadow-2xl`}
      >
        <div className="flex items-center justify-between px-1 sm:px-0">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            Library
          </h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !user}
            className="p-2.5 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors text-gray-300 disabled:opacity-50"
            title="Upload Material"
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

        <div className="relative mt-1 sm:mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2 mt-2 custom-scrollbar">
          {filteredMaterials.map((material) => (
            <button
              key={material.id}
              onClick={() => setSelectedMaterial(material)}
              className={`w-full text-left p-3.5 sm:p-3 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] ${selectedMaterial?.id === material.id ? 'bg-white/10 border-white/20 shadow-md' : 'bg-white/2 md:bg-transparent border-white/5 md:border-transparent hover:bg-white/5'}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${selectedMaterial?.id === material.id ? 'text-white' : 'text-gray-200 md:text-gray-300'}`}>{material.name}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-medium text-gray-500">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 md:text-gray-400">{material.type}</span>
                  <span>{material.dateAdded}</span>
                </div>
              </div>
            </button>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No materials found.
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content - Document Viewer / Empty Desktop Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${selectedMaterial ? 'flex' : 'hidden md:flex'} flex-1 bg-transparent md:bg-[#141414] border-0 md:border md:border-white/5 rounded-none md:rounded-[15px] flex-col overflow-hidden relative shadow-none md:shadow-2xl`}
      >
        {selectedMaterial ? (
          <>
            {/* Viewer Header */}
            <div className="h-14 sm:h-16 border-b border-white/10 md:border-white/5 flex items-center justify-between px-3 sm:px-6 bg-[#141414] md:bg-[#1a1a1a]/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="md:hidden p-2 -ml-1 hover:bg-white/10 active:bg-white/20 rounded-full text-gray-300 transition-colors flex items-center gap-1"
                  aria-label="Back to materials library"
                  title="Back to Library"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 text-sm text-gray-400 min-w-0">
                  <span className="truncate max-w-35 xs:max-w-[200px] sm:max-w-md text-white font-medium">{selectedMaterial.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={handleOpenQuizSetup}
                  disabled={!selectedMaterial || isGeneratingQuiz || !isAIServiceHealthy}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-400 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:hidden" />
                  <span>{isGeneratingQuiz ? 'GENERATING...' : 'GENERATE QUIZ'}</span>
                </button>
                <button
                  onClick={handleOpenQuizHistory}
                  disabled={!selectedMaterial}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Open saved quizzes"
                >
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
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 sm:mb-8 shadow-inner border border-white/5">
                      <FileIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">Document Preview Unavailable</h3>
                    <p className="text-gray-400 mb-6 sm:mb-8 max-w-sm text-xs sm:text-sm">This file format ({selectedMaterial.type}) cannot be previewed directly in the browser.</p>
                    <a
                      href={selectedMaterial.url}
                      download={selectedMaterial.name}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium text-xs sm:text-sm border border-white/10 flex items-center gap-2"
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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-linear-to-b from-transparent to-[#0a0a0a]/50">
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

