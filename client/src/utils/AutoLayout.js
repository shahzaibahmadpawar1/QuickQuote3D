export const generateAutoLayout = (items, roomDimensions) => {
    // Basic grid layout algorithm
    const spacing = 2; // meters
    const cols = Math.floor(roomDimensions.width / spacing);

    return items.map((item, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Center the grid in the room
        const x = (col * spacing) - (roomDimensions.width / 2) + (spacing / 2);
        const z = (row * spacing) - (roomDimensions.length / 2) + (spacing / 2);

        return {
            ...item,
            id: crypto.randomUUID(),
            position: [x, 0, z],
            rotation: [0, 0, 0]
        };
    });
};
