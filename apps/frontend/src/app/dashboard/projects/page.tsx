'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';

const statusColors: Record<string, string> = {
  BIDDING: 'bg-yellow-100 text-yellow-800',
  AWARDED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-gray-50 text-gray-500',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', city: '', state: '' });

  const fetchProjects = async () => {
    try {
      const res: any = await projectsApi.getAll();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsApi.create(newProject);
      setNewProject({ name: '', city: '', state: '' });
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          New Project
        </button>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Sunset Ridge Apartments"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  value={newProject.city}
                  onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                  className="input-field"
                  placeholder="Austin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  value={newProject.state}
                  onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                  className="input-field"
                  placeholder="TX"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to get started with takeoffs.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 leading-tight">{project.name}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status] || ''}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              {(project.city || project.state) && (
                <p className="text-sm text-gray-500 mb-2">
                  {[project.city, project.state].filter(Boolean).join(', ')}
                </p>
              )}
              {project.generalContractor && (
                <p className="text-xs text-gray-400">GC: {project.generalContractor}</p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{project._count?.buildings || 0} building{(project._count?.buildings || 0) !== 1 ? 's' : ''}</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
