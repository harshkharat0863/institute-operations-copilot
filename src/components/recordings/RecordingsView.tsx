import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  ExternalLink,
  BookOpen,
  User,
  CheckCircle2,
  Sparkles,
  Eye,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { ClassRecording } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const RecordingsView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  // Video Player Modal
  const [activeVideo, setActiveVideo] = useState<ClassRecording | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getRecordings();
      setRecordings(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load recordings library', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimAttendanceCredit = (rec: ClassRecording) => {
    showToast(`Attendance credit recorded for reviewing "${rec.topic}"!`, 'success');
  };

  const filteredRecordings = recordings.filter(r => {
    const matchesBatch = selectedBatch === 'all' || r.batch_id === selectedBatch;
    const matchesSearch =
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.trainer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Class Recordings & Lecture Archive
            </h1>
            <Badge variant="info" size="sm">
              1080p HD
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            On-demand video lectures, lab walkthroughs, code repositories, and timestamped curriculum reviews.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Batches</option>
            <option value="b_java_a">Java Fullstack - Batch A</option>
            <option value="b_py_a">Python Data Eng - Batch A</option>
            <option value="b_ds_a">Data Science & GenAI - Batch A</option>
            <option value="b_devops_a">DevOps & Cloud - Batch A</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topic, trainer, or framework..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading lecture archive...
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          No lecture recordings found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredRecordings.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
            >
              {/* Thumbnail with Play Overlay */}
              <div
                className="relative h-48 bg-slate-900 cursor-pointer group overflow-hidden"
                onClick={() => setActiveVideo(rec)}
              >
                <img
                  src={rec.thumbnail_url}
                  alt={rec.topic}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {rec.duration_minutes} mins
                </div>

                <div className="absolute top-2.5 right-2.5 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                  {rec.source}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold mb-1">
                    <span>{rec.batch_name}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-normal">{rec.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {rec.topic}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rec.trainer_name}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{rec.views_count} views</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setActiveVideo(rec)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Watch Lecture
                  </button>

                  <button
                    onClick={() => handleClaimAttendanceCredit(rec)}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Claim Makeup Attendance Credit"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player & Chapter Index Modal */}
      {activeVideo && (
        <Modal
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          title={activeVideo.topic}
          description={`${activeVideo.batch_name} • Instructor: ${activeVideo.trainer_name} (${activeVideo.duration_minutes}m)`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* HTML5 Video Player */}
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative shadow-md">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={activeVideo.thumbnail_url}
              >
                <source src={activeVideo.video_url} type="video/mp4" />
                Your browser does not support HTML5 video tag.
              </video>
            </div>

            {/* Chapters & Key Timestamps */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Chapter Bookmarks & Key Timestamps
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeVideo.key_timestamps.map((ts, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-slate-800">{ts.label}</span>
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {ts.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {activeVideo.notes_download_url && (
                  <a
                    href={activeVideo.notes_download_url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    Download Class Slides (PDF)
                  </a>
                )}
                {activeVideo.code_repo_url && (
                  <a
                    href={activeVideo.code_repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    GitHub Code Repo
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  handleClaimAttendanceCredit(activeVideo);
                  setActiveVideo(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Claim Watch Credit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
