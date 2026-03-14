import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cvApi } from '../services/api';
import { Upload, File, X, FileText, Briefcase } from 'lucide-react';

function DropZone({ label, hint, file, onChange, onClear, required }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {file ? (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <FileText size={20} className="text-blue-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(0)} Ko</p>
          </div>
          <button onClick={onClear} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
          }`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600 font-medium">
            Glissez-déposez ou <span className="text-blue-700">parcourir</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => onChange(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [cvFile, setCvFile] = useState(null);
  const [skillsFile, setSkillsFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) return setError('Veuillez sélectionner votre CV.');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      if (skillsFile) formData.append('skills', skillsFile);
      if (jobTitle.trim()) formData.append('job_title', jobTitle.trim());

      const res = await cvApi.upload(formData);
      navigate(`/generate/${res.data.session_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'upload. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nouveau CV</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Uploadez votre CV et laissez l'IA générer 3 versions personnalisées.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* CV Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-blue-700" />
            Votre CV actuel
          </h2>
          <DropZone
            label="CV"
            hint="PDF ou Word (.docx) · Max 20 Mo"
            file={cvFile}
            onChange={setCvFile}
            onClear={() => setCvFile(null)}
            required
          />
        </div>

        {/* Skills + Job */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-700" />
            Personnalisation <span className="text-slate-400 font-normal text-sm">(optionnel)</span>
          </h2>

          <DropZone
            label="Fiche de compétences / nouvelles missions"
            hint="Document listant vos nouvelles compétences ou missions — PDF ou Word"
            file={skillsFile}
            onChange={setSkillsFile}
            onClear={() => setSkillsFile(null)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Intitulé de poste cible
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Lead Developer Java, Architecte Cloud AWS..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Si renseigné, les CV seront optimisés pour ce poste.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !cvFile}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload size={16} />
              Générer mes CV
            </>
          )}
        </button>
      </form>
    </div>
  );
}
