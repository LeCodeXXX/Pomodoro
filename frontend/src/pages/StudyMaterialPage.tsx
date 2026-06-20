import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Search, BookOpen, BrainCircuit, MoreVertical, X, File as FileIcon } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  type: string;
  dateAdded: string;
  size: string;
}

const MOCK_MATERIALS: Material[] = [
  { id: '1', name: 'Biology Chapter 1: Cell Structure', type: 'PDF', dateAdded: 'Today', size: '2.4 MB' },
  { id: '2', name: 'Midterm Review Notes', type: 'DOCX', dateAdded: 'Yesterday', size: '1.1 MB' },
  { id: '3', name: 'Programming Concepts', type: 'TXT', dateAdded: '3 days ago', size: '14 KB' },
];

export function StudyMaterialPage() {
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto overflow-hidden">
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
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-300">
            <Upload className="w-4 h-4" />
          </button>
        </div>

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

            {/* Mock Viewer Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#0a0a0a] inset-shadow-sm">
              <div className="max-w-3xl mx-auto">
                <div className="aspect-[1/1.4] bg-[#111] rounded-xl border border-white/5 shadow-2xl p-12 relative overflow-hidden flex flex-col">
                  {/* Decorative blur */}
                  <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                  <div className="space-y-8 opacity-40 flex-1">
                    <div className="h-10 w-3/4 bg-white/10 rounded-xl" />
                    <div className="h-5 w-1/4 bg-white/5 rounded-md" />
                    <div className="space-y-4 mt-16">
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                      <div className="h-4 w-[90%] bg-white/5 rounded-md" />
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                      <div className="h-4 w-[85%] bg-white/5 rounded-md" />
                    </div>
                    <div className="space-y-4 mt-10">
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                      <div className="h-4 w-[95%] bg-white/5 rounded-md" />
                      <div className="h-4 w-full bg-white/5 rounded-md" />
                    </div>
                  </div>

                  <div className="mt-auto pt-10 flex items-center justify-between border-t border-white/5 opacity-50">
                    <span className="text-xs text-white/50">Page 1 of 12</span>
                    <FileIcon className="w-6 h-6 text-white/20" />
                  </div>
                </div>
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
            <button className="flex items-center gap-3 px-8 py-4 bg-[#ededed] hover:bg-white text-black rounded-full font-semibold transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105">
              <Upload className="w-5 h-5" />
              Upload Material
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
