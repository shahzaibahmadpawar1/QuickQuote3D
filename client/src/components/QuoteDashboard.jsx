import React from 'react';

const QuoteDashboard = ({ items, totalCost }) => {
    return (
        <div className="bg-white p-4 rounded shadow-md h-full overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-2 border-b pb-2">Quote Dashboard</h2>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {items.length === 0 ? (
                    <p className="text-gray-400 text-center italic mt-4">Room is empty.</p>
                ) : (
                    items.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                            <div>
                                <span className="font-semibold block">{item.name}</span>
                                <span className="text-xs text-gray-500">{item.category}</span>
                            </div>
                            <span className="font-bold">${item.price}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">${totalCost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default QuoteDashboard;
