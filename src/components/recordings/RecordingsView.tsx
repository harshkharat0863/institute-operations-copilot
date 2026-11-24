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
      setRecordings(data || []);
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
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (r.topic && r.topic.toLowerCase().includes(q)) ||
      (r.course_name && r.course_name.toLowerCase().includes(q)) ||
      (r.trainer_name && r.trainer_name.toLowerCase().includes(q));
    return matchesBatch && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
          Class Recordings & Lecture Archive
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          On-demand video lectures, lab walkthroughs, code repositories, and timestamped reviews.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 rounded-[6px] border border-border  flex flex-col sm:flex-row items-center justify-between gap-3">
        <select
          value={selectedBatch}
          onChange={e => setSelectedBatch(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text-muted font-medium focus:outline-hidden"
        >
          <option value="all">All Batches</option>
          <option value="b_java_a">Java Fullstack - Batch A</option>
          <option value="b_py_a">Python Data Eng - Batch A</option>
          <option value="b_ds_a">Data Science & GenAI - Batch A</option>
          <option value="b_devops_a">DevOps & Cloud - Batch A</option>
        </select>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topic, trainer, module..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-text-subtle text-sm bg-surface rounded-[6px] border border-border">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading lecture archive...
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="p-12 text-center text-text-muted text-sm bg-surface rounded-[6px] border border-border">
          No lecture recordings found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecordings.map(rec => (
            <div
              key={rec.id}
              className="bg-surface rounded-[6px] border border-border  overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              {/* Thumbnail */}
              <div
                className="relative h-44 bg-slate-900 cursor-pointer group overflow-hidden"
                onClick={() => setActiveVideo(rec)}
              >
                <img
                  src={rec.thumbnail_url}
                  alt={rec.topic}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-surface/95 text-accent flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {rec.duration_minutes}m
                </div>

                <div className="absolute top-2 right-2 bg-accent text-white text-[10px] font-semibold px-2 py-0.5 rounded-full ">
                  {rec.source}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-accent font-semibold mb-1">
                    <span>{rec.batch_name}</span>
                    <span className="text-slate-300">┬╖</span>
                    <span className="text-text-subtle font-normal">{rec.date}</span>
                  </div>
                  <h3 className="font-semibold text-text text-sm leading-snug">
                    {rec.topic}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
                  <div className="flex items-center gap-1 font-medium text-text-muted">
                    <User className="w-3 h-3 text-text-subtle" />
                    <span>{rec.trainer_name}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-text-subtle font-mono">
                    <Eye className="w-3 h-3" />
                    <span>{rec.views_count} views</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => setActiveVideo(rec)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] bg-accent hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Watch Lecture
                  </button>

                  <button
                    onClick={() => handleClaimAttendanceCredit(rec)}
                    className="px-2.5 py-2 rounded-[6px] border border-border hover:bg-surface-subtle text-text-muted text-xs font-medium transition-colors cursor-pointer"
                    title="Claim attendance credit"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <Modal
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          title={activeVideo.topic}
          description={`${activeVideo.batch_name} ┬╖ Instructor: ${activeVideo.trainer_name} (${activeVideo.duration_minutes}m)`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Player */}
            <div className="rounded-[6px] overflow-hidden bg-black aspect-video relative">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={activeVideo.thumbnail_url}
              >
                <source src={activeVideo.video_url} type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Chapters */}
            <div>
              <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Key Topics & Timestamps
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {activeVideo.key_timestamps.map((ts, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-[6px] bg-surface-subtle border border-border text-xs flex items-center justify-between hover:bg-surface-muted transition-colors"
                  >
                    <span className="text-text-muted">{ts.label}</span>
                    <span className="font-mono text-accent bg-surface border border-border px-1 rounded text-[10px] font-semibold">
                      {ts.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Footer */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {activeVideo.notes_download_url && (
                  <a
                    href={activeVideo.notes_download_url}
                    download
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface hover:bg-surface-subtle text-text-muted text-xs font-medium"
                  >
                    <Download className="w-3 h-3 text-accent" />
                    Slides PDF
                  </a>
                )}
                {activeVideo.code_repo_url && (
                  <a
                    href={activeVideo.code_repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface hover:bg-surface-subtle text-text-muted text-xs font-medium"
                  >
                    <FileCode className="w-3 h-3 text-emerald-600" />
                    GitHub Repo
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  handleClaimAttendanceCredit(activeVideo);
                  setActiveVideo(null);
                }}
                className="px-3 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
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


