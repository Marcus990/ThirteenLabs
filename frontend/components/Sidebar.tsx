import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Menu,
  X,
  History,
  Play,
  Eye,
  Trash2,
  Calendar,
  FileText,
  Box,
} from "lucide-react";
import { getModelEntries, deleteModelEntry, ModelEntry } from "../lib/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load entries immediately when component mounts
    loadEntries();
  }, []);

  useEffect(() => {
    // Also reload when isOpen changes (for mobile toggle)
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getModelEntries();
      setEntries(response.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: ModelEntry) => {
    // Navigate directly to the results page using the entry ID
    router.push(`/result/${entry.id}`);
    onClose();
  };

  const handleDeleteEntry = async (
    entryId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (!confirm("Are you sure you want to delete this experience?")) {
      return;
    }

    try {
      await deleteModelEntry(entryId);
      setEntries(entries.filter((entry) => entry.id !== entryId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-700 z-50
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:relative lg:z-auto
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <History size={16} />
            </div>
            <h2 className="text-xl font-bold text-white">My Experiences</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="relative w-8 h-8 mx-auto mb-4">
                {/* Spinner Ring Background */}
                <div className="absolute inset-0 rounded-full border-2 border-purple-200/20" />
                
                {/* Spinner Ring Animated Top Segment */}
                <div className="absolute inset-0 rounded-full border-2 border-t-purple-500 border-transparent animate-spin" />
                
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    {/* 3D Cube Icon */}
                    <div className="w-2 h-2 relative">
                      {/* Cube faces */}
                      <div className="absolute inset-0 transform rotate-45">
                        {/* Front face */}
                        <div className="absolute inset-0 bg-white rounded-sm"></div>
                        
                        {/* Right face */}
                        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-sm transform rotate-y-45 origin-left"></div>
                        
                        {/* Top face */}
                        <div className="absolute inset-0 bg-white bg-opacity-60 rounded-sm transform rotate-x-45 origin-bottom"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-400">Loading experiences...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadEntries}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} />
              </div>
              <p className="text-gray-400 mb-2">No generations yet</p>
              <p className="text-gray-500 text-sm">
                Upload a video to create your first 3D experience
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleEntryClick(entry)}
                  className="bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm mb-1">
                        {truncateDescription(entry.description)}
                      </h3>
                      <div className="flex items-center text-gray-400 text-xs">
                        <div className="mr-1">
                          <Calendar size={12} />
                        </div>
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors ml-2"
                      title="Delete experience"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center text-gray-400">
                        <div className="mr-1">
                          <Eye size={12} />
                        </div>
                        {entry.timestamps.length} views
                      </div>
                      {entry.threejs_code && (
                        <div className="flex items-center text-green-400">
                          <div className="mr-1">
                            <Box size={12} />
                          </div>
                          3D Experience
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-purple-400">
                      <div className="mr-1">
                        <Play size={12} />
                      </div>
                      View
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
