import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inventory = ({ onDragStart }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '', price: '', category: 'Furniture',
        dimensions: { length: 1, width: 1, height: 1 }
    });

    const fetchItems = async () => {
        try {
            const res = await axios.get('/api/items');
            if (res.data && res.data.length > 0) {
                setItems(res.data);
            } else {
                setItems([
                    { _id: '1', name: 'Office Chair', price: 150, category: 'Chair', dimensions: { length: 0.5, width: 0.5, height: 1 }, color: 'black' },
                    { _id: '2', name: 'Desk', price: 300, category: 'Table', dimensions: { length: 1.2, width: 0.6, height: 0.75 }, color: 'brown' },
                    { _id: '3', name: 'Sofa', price: 500, category: 'Sofa', dimensions: { length: 0.8, width: 2, height: 0.8 }, color: 'navy' },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch items", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleRecommend = async () => {
        // Mock scrape/recommendation call
        const url = prompt("Enter product URL to scrape:");
        if (!url) return;
        try {
            const res = await axios.post('/api/scrape', { url });
            if (res.data) {
                setNewItem({ ...newItem, name: res.data.name, price: res.data.price, thumbnailUrl: res.data.thumbnailUrl });
                setShowForm(true);
            }
        } catch (e) {
            alert("Failed to scrape: " + e.message);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const itemToSave = {
                ...newItem,
                price: Number(newItem.price),
                dimensions: {
                    length: Number(newItem.dimensions.length),
                    width: Number(newItem.dimensions.width),
                    height: Number(newItem.dimensions.height)
                }
            };

            await axios.post('/api/items', itemToSave);
            setShowForm(false);
            fetchItems(); // Refresh list
        } catch (err) {
            alert("Error creating item");
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-xl font-bold">Inventory</h2>
                <div className="space-x-1">
                    <button onClick={() => setShowForm(!showForm)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                        {showForm ? 'Cancel' : '+ New'}
                    </button>
                    <button onClick={handleRecommend} className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600">
                        Import URL
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="p-4 bg-blue-50 border-b space-y-2 text-sm animate-in slide-in-from-top-2">
                    <input
                        placeholder="Name" className="w-full p-1 border rounded" required
                        value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <div className="flex space-x-2">
                        <input
                            type="number" placeholder="Price" className="w-1/2 p-1 border rounded" required
                            value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                        />
                        <select
                            className="w-1/2 p-1 border rounded"
                            value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                        >
                            <option value="Furniture">Furniture</option>
                            <option value="Chair">Chair</option>
                            <option value="Table">Table</option>
                            <option value="Sofa">Sofa</option>
                            <option value="Storage">Storage</option>
                        </select>
                    </div>
                    <div className="flex space-x-1">
                        <input type="number" placeholder="L" className="w-1/3 p-1 border rounded" value={newItem.dimensions.length} onChange={e => setNewItem({ ...newItem, dimensions: { ...newItem.dimensions, length: e.target.value } })} />
                        <input type="number" placeholder="W" className="w-1/3 p-1 border rounded" value={newItem.dimensions.width} onChange={e => setNewItem({ ...newItem, dimensions: { ...newItem.dimensions, width: e.target.value } })} />
                        <input type="number" placeholder="H" className="w-1/3 p-1 border rounded" value={newItem.dimensions.height} onChange={e => setNewItem({ ...newItem, dimensions: { ...newItem.dimensions, height: e.target.value } })} />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-1 rounded hover:bg-green-700 font-semibold">Save Item</button>
                </form>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {loading ? <p className="text-center text-gray-400 mt-4">Loading inventory...</p> : (
                    items.map((item) => (
                        <div
                            key={item._id}
                            className="group border border-gray-200 p-2 rounded-lg cursor-move hover:shadow-md hover:border-blue-300 transition-all bg-white flex items-center space-x-3 active:scale-95"
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                        >
                            <div className="h-12 w-12 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border">
                                {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400">3D</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                                <div className="flex justify-between items-baseline">
                                    <p className="text-sm text-green-600 font-medium">${item.price}</p>
                                    <p className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{item.category}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Inventory;
