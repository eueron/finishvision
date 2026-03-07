'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, buildingsApi, floorsApi, unitsApi, roomsApi } from '@/lib/api';
import { HierarchyTree } from './components/hierarchy-tree';
import { AddItemModal } from './components/add-item-modal';
import { BulkAddModal } from './components/bulk-add-modal';
import type { Project, Room } from '@/types';

type ModalState =
  | null
  | { type: 'addBuilding' }
  | { type: 'addFloor'; buildingId: string }
  | { type: 'addUnit'; floorId: string }
  | { type: 'addRoom'; unitId: string }
  | { type: 'bulkAddUnits'; floorId: string };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ room: Room; breadcrumb: string } | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res: any = await projectsApi.getOne(projectId);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to fetch project', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleAddBuilding = async (values: Record<string, string>) => {
    await buildingsApi.create(projectId, { name: values.name });
    fetchProject();
  };

  const handleAddFloor = async (buildingId: string, values: Record<string, string>) => {
    await floorsApi.create(buildingId, { name: values.name });
    fetchProject();
  };

  const handleAddUnit = async (floorId: string, values: Record<string, string>) => {
    await unitsApi.create(floorId, {
      name: values.name,
      unitType: values.unitType || undefined,
    });
    fetchProject();
  };

  const handleAddRoom = async (unitId: string, values: Record<string, string>) => {
    await roomsApi.create(unitId, {
      name: values.name,
      roomType: values.roomType || undefined,
    });
    fetchProject();
  };

  const handleBulkAddUnits = async (floorId: string, data: any) => {
    await unitsApi.bulkCreate(floorId, data);
    fetchProject();
  };

  const handleDuplicateUnit = async (floorId: string, unitId: string) => {
    await unitsApi.duplicate(floorId, unitId);
    fetchProject();
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!confirm('Delete this building and all its contents?')) return;
    await buildingsApi.delete(projectId, buildingId);
    fetchProject();
  };

  const handleDeleteFloor = async (buildingId: string, floorId: string) => {
    if (!confirm('Delete this floor and all its contents?')) return;
    await floorsApi.delete(buildingId, floorId);
    fetchProject();
  };

  const handleDeleteUnit = async (floorId: string, unitId: string) => {
    if (!confirm('Delete this unit and all its rooms?')) return;
    await unitsApi.delete(floorId, unitId);
    fetchProject();
  };

  const handleDeleteRoom = async (unitId: string, roomId: string) => {
    if (!confirm('Delete this room?')) return;
    await roomsApi.delete(unitId, roomId);
    fetchProject();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <button onClick={() => router.push('/dashboard/projects')} className="btn-primary mt-4">
          Back to Projects
        </button>
      </div>
    );
  }

  // Count totals
  let totalBuildings = project.buildings?.length || 0;
  let totalFloors = 0;
  let totalUnits = 0;
  let totalRooms = 0;
  project.buildings?.forEach((b) => {
    b.floors?.forEach((f) => {
      totalFloors++;
      f.units?.forEach((u) => {
        totalUnits++;
        totalRooms += u.rooms?.length || 0;
      });
    });
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">
            {[project.city, project.state].filter(Boolean).join(', ')}
            {project.generalContractor && ` — GC: ${project.generalContractor}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/blueprints`)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Blueprints
          </button>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/takeoff`)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Takeoff
          </button>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/estimates`)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estimates
          </button>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/reports`)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Reports
          </button>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/ai`)}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Dashboard
          </button>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
          project.status === 'BIDDING' ? 'bg-yellow-100 text-yellow-800' :
          project.status === 'AWARDED' ? 'bg-green-100 text-green-800' :
          project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Buildings', value: totalBuildings, color: 'bg-blue-500' },
          { label: 'Floors', value: totalFloors, color: 'bg-green-500' },
          { label: 'Units', value: totalUnits, color: 'bg-amber-500' },
          { label: 'Rooms', value: totalRooms, color: 'bg-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${stat.color}`} />
              <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hierarchy Tree */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Hierarchy</h2>
          <HierarchyTree
            buildings={project.buildings || []}
            onAddBuilding={() => setModal({ type: 'addBuilding' })}
            onAddFloor={(buildingId) => setModal({ type: 'addFloor', buildingId })}
            onAddUnit={(floorId) => setModal({ type: 'addUnit', floorId })}
            onAddRoom={(unitId) => setModal({ type: 'addRoom', unitId })}
            onBulkAddUnits={(floorId) => setModal({ type: 'bulkAddUnits', floorId })}
            onDuplicateUnit={handleDuplicateUnit}
            onDeleteBuilding={handleDeleteBuilding}
            onDeleteFloor={handleDeleteFloor}
            onDeleteUnit={handleDeleteUnit}
            onDeleteRoom={handleDeleteRoom}
            selectedRoomId={selectedRoom?.room.id}
            onSelectRoom={(room, breadcrumb) => setSelectedRoom({ room, breadcrumb })}
          />
        </div>

        {/* Room Detail Panel */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Room Detail</h2>
          {selectedRoom ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">{selectedRoom.breadcrumb}</p>
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{selectedRoom.room.name}</p>
              </div>
              {selectedRoom.room.roomType && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-gray-900">{selectedRoom.room.roomType}</p>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Takeoff items for this room will appear here in Phase 5.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a room from the hierarchy to view details.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addBuilding' && (
        <AddItemModal
          title="Add Building"
          fields={[{ name: 'name', label: 'Building Name', placeholder: 'e.g. Building A', required: true }]}
          onSubmit={handleAddBuilding}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'addFloor' && (
        <AddItemModal
          title="Add Floor"
          fields={[{ name: 'name', label: 'Floor Name', placeholder: 'e.g. Floor 1', required: true }]}
          onSubmit={(values) => handleAddFloor(modal.buildingId, values)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'addUnit' && (
        <AddItemModal
          title="Add Unit"
          fields={[
            { name: 'name', label: 'Unit Name', placeholder: 'e.g. Unit 101', required: true },
            { name: 'unitType', label: 'Unit Type', placeholder: 'e.g. 2BR/2BA' },
          ]}
          onSubmit={(values) => handleAddUnit(modal.floorId, values)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'addRoom' && (
        <AddItemModal
          title="Add Room"
          fields={[
            { name: 'name', label: 'Room Name', placeholder: 'e.g. Living Room', required: true },
            { name: 'roomType', label: 'Room Type', placeholder: 'e.g. bedroom, bathroom' },
          ]}
          onSubmit={(values) => handleAddRoom(modal.unitId, values)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'bulkAddUnits' && (
        <BulkAddModal
          onSubmit={(data) => handleBulkAddUnits(modal.floorId, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
