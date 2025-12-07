import React, { useState } from 'react';
import Scene from './components/Scene';
import Inventory from './components/Inventory';
import QuoteDashboard from './components/QuoteDashboard';
import { generateAutoLayout } from './utils/AutoLayout';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [rooms, setRooms] = useState([
    { id: '1', name: 'Living Room', dimensions: { length: 5, width: 5, height: 3 }, items: [] }
  ]);
  const [activeRoomId, setActiveRoomId] = useState('1');
  const [draggedItem, setDraggedItem] = useState(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const handleAddRoom = () => {
    const newRoom = {
      id: uuidv4(),
      name: `Room ${rooms.length + 1}`,
      dimensions: { length: 5, width: 5, height: 3 },
      items: []
    };
    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoom.id);
  };

  const updateActiveRoom = (updates) => {
    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
  };

  const handleDropItem = () => {
    if (draggedItem) {
      const newItem = {
        ...draggedItem,
        id: uuidv4(),
        position: [0, 0.5, 0],
        rotation: [0, 0, 0]
      };
      updateActiveRoom({ items: [...activeRoom.items, newItem] });
      setDraggedItem(null);
    }
  };

  const handleUpdateItem = (id, position, rotation) => {
    const updatedItems = activeRoom.items.map(item => {
      if (item.id === id) {
        return { ...item, position, rotation };
      }
      return item;
    });
    updateActiveRoom({ items: updatedItems });
  };

  const calculateTotalCost = () => {
    return activeRoom.items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`QuickQuote 3D - ${activeRoom.name}`, 10, 10);
    doc.text(`Dimensions: ${activeRoom.dimensions.length}x${activeRoom.dimensions.width}m`, 10, 20);
    doc.text(`Total Cost: $${calculateTotalCost().toFixed(2)}`, 10, 30);

    let y = 40;
    activeRoom.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} - $${item.price}`, 10, y);
      y += 10;
    });

    doc.save(`${activeRoom.name}_quote.pdf`);
  };

  const handleAutoLayout = () => {
    if (activeRoom.items.length === 0) {
      alert("Add items manually to the room first.");
      return;
    }
    const layout = generateAutoLayout(activeRoom.items, activeRoom.dimensions);
    updateActiveRoom({ items: layout });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans text-gray-800">
      {/* Sidebar: Inventory & quote */}
      <div className="w-80 flex flex-col border-r bg-gray-100">
        <div className="h-1/2 overflow-hidden border-b">
          <Inventory onDragStart={handleDragStart} />
        </div>
        <div className="h-1/2 overflow-hidden">
          <QuoteDashboard items={activeRoom.items} totalCost={calculateTotalCost()} />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative bg-gray-900">

        {/* Top Bar: Room Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 p-2 shadow flex justify-between items-center px-4 backdrop-blur-sm">
          <div className="flex space-x-2 overflow-x-auto max-w-md">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap ${room.id === activeRoomId ? 'bg-blue-600 text-white chat-bubble' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {room.name}
              </button>
            ))}
            <button onClick={handleAddRoom} className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">+</button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs">
              <label className="mr-1">L:</label>
              <input
                type="number"
                value={activeRoom.dimensions.length}
                onChange={(e) => updateActiveRoom({ dimensions: { ...activeRoom.dimensions, length: Number(e.target.value) } })}
                className="w-12 border rounded px-1"
              />
              <label className="mx-1">W:</label>
              <input
                type="number"
                value={activeRoom.dimensions.width}
                onChange={(e) => updateActiveRoom({ dimensions: { ...activeRoom.dimensions, width: Number(e.target.value) } })}
                className="w-12 border rounded px-1"
              />
            </div>
            <button onClick={handleAutoLayout} className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">Auto Layout</button>
            <button onClick={handleExportPDF} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Export PDF</button>
          </div>
        </div>

        <Scene
          roomDimensions={activeRoom.dimensions}
          items={activeRoom.items}
          onUpdateItem={handleUpdateItem}
          onDropItem={handleDropItem}
        />
      </div>
    </div>
  );
}

export default App;
