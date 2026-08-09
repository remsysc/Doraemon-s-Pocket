import React, { useState } from "react";
import "../../css/inventory.css";

function CategoryManagement() {
    const [categories, setCategories] = useState([
        { id: 1, name: "Refrigerators" },
        { id: 2, name: "Air Conditioners" },
        { id: 3, name: "Televisions" },
        { id: 4, name: "Washing Machines" }
    ]);

    const [categoryName, setCategoryName] = useState("");

    const addCategory = () => {
        if (!categoryName.trim()) return;

        setCategories([
            ...categories,
            {
                id: categories.length + 1,
                name: categoryName
            }
        ]);

        setCategoryName("");
    };

    const deleteCategory = (id) => {
        setCategories(categories.filter(category => category.id !== id));
    };

    return (
        <div className="container">
            <h1>Category Management</h1>

            <div className="form">
                <input
                    type="text"
                    placeholder="Enter Appliance Category"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                />

                <button onClick={addCategory}>Add Category</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {categories.map(category => (
                        <tr key={category.id}>
                            <td>{category.id}</td>
                            <td>{category.name}</td>
                            <td>
                                <button
                                    className="delete"
                                    onClick={() => deleteCategory(category.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default CategoryManagement;
