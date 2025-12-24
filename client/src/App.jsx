import { useState, useRef } from "react";
import { Package, Upload, FileSpreadsheet, Info, RefreshCw, TreeDeciduous, Search, Palette, Zap } from "lucide-react";
import TreeWorkspace from "./components/TreeWorkspace";
import { parseExcel } from "./components/ExcelUpload";

export default function App() {
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      await parseExcel(file, setTreeData);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to parse Excel file. Please check the file format.");
      setIsLoading(false);
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleReset = () => {
    setTreeData(null);
    setFileName("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (treeData) {
    return (
      <>
        <TreeWorkspace data={treeData} />
        <button
          onClick={handleReset}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          <RefreshCw className="w-5 h-5" />
          Upload New File
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex items-center justify-center p-10 bg-[#0a0e1a]">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-cyan-500/10 to-transparent animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-cyan-600/10 to-transparent animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
              <Package className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
            BharatNetra's NCRP-GraphX
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Visualize complex transaction hierarchies with interactive layer-based diagrams
          </p>
        </div>

        {/* Upload Card */}
        <div
          className={`bg-[#0f1419] border-2 rounded-3xl p-16 text-center transition-all duration-300 ${isDragging
            ? 'border-cyan-500 bg-cyan-500/5 scale-[1.02]'
            : 'border-slate-800 hover:border-slate-700'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="py-10">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Processing {fileName}...</h3>
              <p className="text-slate-400">Building transaction hierarchy</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Upload className="w-16 h-16 mx-auto text-cyan-500/80 transition-transform hover:scale-110 hover:text-cyan-500" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Upload Excel File</h2>
              <p className="text-slate-400 text-base mb-8 font-medium">
                Drag and drop your Excel file here, or click to browse
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                id="file-input"
                className="hidden"
              />

              <label
                htmlFor="file-input"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl cursor-pointer shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Upload className="w-5 h-5" />
                Choose File
              </label>

              <div className="mt-8 space-y-3 max-w-md mx-auto">
                <div className="flex items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 transition-colors">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300 font-medium">Supports .xlsx and .xls formats</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 transition-colors">
                  <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300 font-medium">Ensure your file has Account No and Layer columns</span>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-semibold animate-fade-in">
              <Info className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="bg-[#0f1419] border border-slate-800 rounded-2xl p-6 text-center hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <TreeDeciduous className="w-10 h-10 mx-auto mb-4 text-cyan-400" />
            <h3 className="text-lg font-bold text-white mb-2">Layer-wise View</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Organized by transaction layers</p>
          </div>
          <div className="bg-[#0f1419] border border-slate-800 rounded-2xl p-6 text-center hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <Search className="w-10 h-10 mx-auto mb-4 text-cyan-400" />
            <h3 className="text-lg font-bold text-white mb-2">Interactive Details</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Click for complete information</p>
          </div>
          <div className="bg-[#0f1419] border border-slate-800 rounded-2xl p-6 text-center hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <Palette className="w-10 h-10 mx-auto mb-4 text-cyan-400" />
            <h3 className="text-lg font-bold text-white mb-2">Professional Design</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Clean and modern interface</p>
          </div>
          <div className="bg-[#0f1419] border border-slate-800 rounded-2xl p-6 text-center hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <Zap className="w-10 h-10 mx-auto mb-4 text-cyan-400" />
            <h3 className="text-lg font-bold text-white mb-2">Fast Processing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Instant analysis and visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
