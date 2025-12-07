import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inventory = ({ onDragStart }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch items from backend
        // For demo purposes, if backend fails or is empty, use mock data
        const fetchItems = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/items');
                if (res.data && res.data.length > 0) {
                    setItems(res.data);
                } else {
                    // Mock data if DB is empty for demo
                    setItems([
                        { _id: '1', name: 'Office Chair', price: 150, category: 'Furniture', dimensions: { length: 0.5, width: 0.5, height: 1 }, color: 'black' },
                        { _id: '2', name: 'Desk', price: 300, category: 'Furniture', dimensions: { length: 1.2, width: 0.6, height: 0.75 }, color: 'brown' },
                    ]);
                }
            } catch (err) {
                console.error("Failed to fetch items", err);
                setItems([
                    { _id: '1', name: 'Office Chair', price: 150, category: 'Furniture', dimensions: { length: 0.5, width: 0.5, height: 1 }, color: 'black' },
                    { _id: '2', name: 'Desk', price: 300, category: 'Furniture', dimensions: { length: 1.2, width: 0.6, height: 0.75 }, color: 'brown' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    return (
        <div className="w-64 bg-white shadow-lg p-4 h-full overflow-y-auto z-10">
            <h2 className="text-xl font-bold mb-4">Inventory</h2>
            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item._id}
                            className="border p-2 rounded cursor-move hover:bg-gray-50 flex flex-col"
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                        >
                            <div className="h-20 bg-gray-200 mb-2 rounded flex items-center justify-center">
                                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.name} className="h-full object-cover" /> : <span className="text-gray-500">No Image</span>}
                            </div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">${item.price}</p>
                            <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Inventory;
