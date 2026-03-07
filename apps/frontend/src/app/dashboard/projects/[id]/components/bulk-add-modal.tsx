'use client';

import { useState } from 'react';

const ROOM_TEMPLATES: Record<string, { name: string; roomType: string }[]> = {
  'Studio': [
    { name: 'Main Room', roomType: 'studio' },
    { name: 'Bathroom', roomType: 'bathroom' },
    { name: 'Kitchen', roomType: 'kitchen' },
  ],
  '1BR/1BA': [
    { name: 'Living Room', roomType: 'living' },
    { name: 'Bedroom', roomType: 'bedroom' },
    { name: 'Bathroom', roomType: 'bathroom' },
    { name: 'Kitchen', roomType: 'kitchen' },
  ],
  '2BR/1BA': [
    { name: 'Living Room', roomType: 'living' },
    { name: 'Master Bedroom', roomType: 'bedroom' },
    { name: 'Bedroom 2', roomType: 'bedroom' },
    { name: 'Bathroom', roomType: 'bathroom' },
    { name: 'Kitchen', roomType: 'kitchen' },
  ],
  '2BR/2BA': [
    { name: 'Living Room', roomType: 'living' },
    { name: 'Master Bedroom', roomType: 'bedroom' },
    { name: 'Bedroom 2', roomType: 'bedroom' },
    { name: 'Kitchen', roomType: 'kitchen' },
    { name: 'Master Bath', roomType: 'bathroom' },
    { name: 'Hall Bath', roomType: 'bathroom' },
  ],
  '3BR/2BA': [
    { name: 'Living Room', roomType: 'living' },
    { name: 'Master Bedroom', roomType: 'bedroom' },
    { name: 'Bedroom 2', roomType: 'bedroom' },
    { name: 'Bedroom 3', roomType: 'bedroom' },
    { name: 'Kitchen', roomType: 'kitchen' },
    { name: 'Master Bath', roomType: 'bathroom' },
    { name: 'Hall Bath', roomType: 'bathroom' },
  ],
};

interface BulkAddModalProps {
  onSubmit: (data: {
    prefix: string;
    startNumber: number;
    count: number;
    unitType: string;
    roomTemplate: { name: string; roomType: string }[];
  }) => Promise<void>;
  onClose: () => void;
}

export function BulkAddModal({ onSubmit, onClose }: BulkAddModalProps) {
  const [prefix, setPrefix] = useState('Unit ');
  const [startNumber, setStartNumber] = useState(101);
  const [count, setCount] = useState(4);
  const [unitType, setUnitType] = useState('2BR/2BA');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        prefix,
        startNumber,
        count,
        unitType,
        roomTemplate: ROOM_TEMPLATES[unitType] || [],
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Create Units</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
              <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start #</label>
              <input type="number" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
              <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="input-field" min={1} max={50} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type Template</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="input-field"
            >
              {Object.keys(ROOM_TEMPLATES).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Preview: Will create {count} units</p>
            <div className="text-xs text-gray-600 space-y-0.5">
              {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                <p key={i}>{prefix}{startNumber + i} ({unitType}) — {ROOM_TEMPLATES[unitType]?.length || 0} rooms</p>
              ))}
              {count > 3 && <p className="text-gray-400">... and {count - 3} more</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : `Create ${count} Units`}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
