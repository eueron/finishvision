'use client';

import { useState } from 'react';
import type { Building, Floor, Unit, Room } from '@/types';

interface HierarchyTreeProps {
  buildings: Building[];
  onAddBuilding: () => void;
  onAddFloor: (buildingId: string) => void;
  onAddUnit: (floorId: string) => void;
  onAddRoom: (unitId: string) => void;
  onBulkAddUnits: (floorId: string) => void;
  onDuplicateUnit: (floorId: string, unitId: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
  onDeleteFloor: (buildingId: string, floorId: string) => void;
  onDeleteUnit: (floorId: string, unitId: string) => void;
  onDeleteRoom: (unitId: string, roomId: string) => void;
  selectedRoomId?: string;
  onSelectRoom?: (room: Room, breadcrumb: string) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export function HierarchyTree(props: HierarchyTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isOpen = (id: string) => expanded[id] !== false; // default open

  return (
    <div className="space-y-1">
      {/* Add Building button */}
      <button
        onClick={props.onAddBuilding}
        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
      >
        <PlusIcon /> Add Building
      </button>

      {props.buildings.map((building) => (
        <div key={building.id} className="ml-1">
          {/* Building Node */}
          <div className="flex items-center group">
            <button onClick={() => toggle(`b-${building.id}`)} className="p-0.5 hover:bg-gray-100 rounded">
              <ChevronIcon open={isOpen(`b-${building.id}`)} />
            </button>
            <div className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-gray-800">{building.name}</span>
              <span className="text-xs text-gray-400">{building.floors?.length || 0} floors</span>
            </div>
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button onClick={() => props.onAddFloor(building.id)} className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-brand-50" title="Add Floor">
                <PlusIcon />
              </button>
              <button onClick={() => props.onDeleteBuilding(building.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete Building">
                <TrashIcon />
              </button>
            </div>
          </div>

          {/* Floors */}
          {isOpen(`b-${building.id}`) && building.floors?.map((floor) => (
            <div key={floor.id} className="ml-6">
              <div className="flex items-center group">
                <button onClick={() => toggle(`f-${floor.id}`)} className="p-0.5 hover:bg-gray-100 rounded">
                  <ChevronIcon open={isOpen(`f-${floor.id}`)} />
                </button>
                <div className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">{floor.name}</span>
                  <span className="text-xs text-gray-400">{floor.units?.length || 0} units</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={() => props.onAddUnit(floor.id)} className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-brand-50" title="Add Unit">
                    <PlusIcon />
                  </button>
                  <button onClick={() => props.onBulkAddUnits(floor.id)} className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-brand-50" title="Bulk Add Units">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                  <button onClick={() => props.onDeleteFloor(building.id, floor.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete Floor">
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Units */}
              {isOpen(`f-${floor.id}`) && floor.units?.map((unit) => (
                <div key={unit.id} className="ml-6">
                  <div className="flex items-center group">
                    <button onClick={() => toggle(`u-${unit.id}`)} className="p-0.5 hover:bg-gray-100 rounded">
                      <ChevronIcon open={isOpen(`u-${unit.id}`)} />
                    </button>
                    <div className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-gray-700">{unit.name}</span>
                      {unit.unitType && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{unit.unitType}</span>}
                      <span className="text-xs text-gray-400">{unit.rooms?.length || 0} rooms</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button onClick={() => props.onAddRoom(unit.id)} className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-brand-50" title="Add Room">
                        <PlusIcon />
                      </button>
                      <button onClick={() => props.onDuplicateUnit(floor.id, unit.id)} className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-brand-50" title="Duplicate Unit">
                        <CopyIcon />
                      </button>
                      <button onClick={() => props.onDeleteUnit(floor.id, unit.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete Unit">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* Rooms */}
                  {isOpen(`u-${unit.id}`) && unit.rooms?.map((room) => (
                    <div key={room.id} className="ml-6">
                      <div
                        className={`flex items-center group px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          props.selectedRoomId === room.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => props.onSelectRoom?.(room, `${building.name} > ${floor.name} > ${unit.name} > ${room.name}`)}
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                        <span className="text-sm text-gray-600">{room.name}</span>
                        {room.roomType && <span className="text-xs text-gray-400 ml-2">{room.roomType}</span>}
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); props.onDeleteRoom(unit.id, room.id); }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                            title="Delete Room"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {props.buildings.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No buildings yet. Click &quot;Add Building&quot; to start.
        </div>
      )}
    </div>
  );
}
