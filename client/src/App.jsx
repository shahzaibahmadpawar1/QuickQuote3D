import React, { useState } from 'react';
import Scene from './components/Scene';
import Inventory from './components/Inventory';
import { generateAutoLayout } from './utils/AutoLayout';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [roomDimensions, setRoomDimensions] = useState({ length: 5, width: 5, height: 3 });
  const [sceneItems, setSceneItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
  };

  const handleDropItem = () => {
    if (draggedItem) {
      const newItem = {
        ...draggedItem,
        id: uuidv4(),
        position: [0, 0.5, 0], // Default spawn height 0.5 (half unit box)
        rotation: [0, 0, 0]
      };
      setSceneItems([...sceneItems, newItem]);
      setDraggedItem(null);
    }
  };

  const handleUpdateItem = (id, position, rotation) => {
    setSceneItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, position, rotation };
      }
      return item;
    }));
  };

  const calculateTotalCost = () => {
    return sceneItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("QuickQuote 3D Estimate", 10, 10);
    doc.text(`Total Cost: $${calculateTotalCost()}`, 10, 20);

    let y = 30;
    sceneItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} - $${item.price}`, 10, y);
      y += 10;
    });

    doc.save("quote.pdf");
    alert("PDF Exported!");
  };

  const handleAutoLayout = () => {
    // Example: Populate 5 random items
    // In real app, fetch category based items
    if (sceneItems.length === 0) {
      alert("Add items manually or use this validation feature with existing inventory data.");
      return;
    }
    const layout = generateAutoLayout(sceneItems, roomDimensions);
    setSceneItems(layout);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Inventory onDragStart={handleDragStart} />

      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded shadow space-y-2">
          <h1 className="font-bold text-lg">QuickQuote 3D</h1>
          <div>
            <label className="block text-xs">Length (m)</label>
            <input type="number" value={roomDimensions.length} onChange={(e) => setRoomDimensions({ ...roomDimensions, length: Number(e.target.value) })} className="border p-1 w-20" />
          </div>
          <div>
            <label className="block text-xs">Width (m)</label>
            <input type="number" value={roomDimensions.width} onChange={(e) => setRoomDimensions({ ...roomDimensions, width: Number(e.target.value) })} className="border p-1 w-20" />
          </div>
          <div className="pt-2 border-t">
            <p className="font-bold">Total: ${calculateTotalCost()}</p>
          </div>
          <button onClick={handleExportPDF} className="bg-blue-500 text-white p-2 rounded w-full text-sm">Export PDF</button>
          <button onClick={handleAutoLayout} className="bg-green-500 text-white p-2 rounded w-full text-sm mt-2">Auto Layout</button>
        </div>

        <Scene
          roomDimensions={roomDimensions}
          items={sceneItems}
          onUpdateItem={handleUpdateItem}
          onDropItem={handleDropItem}
        />
      </div>
    </div>
  );
}

export default App;
