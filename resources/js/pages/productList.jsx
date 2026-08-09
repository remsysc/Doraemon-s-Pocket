import React, { useState } from "react";
import "../../css/invetory.css";

function ProductList() {

    const [search, setSearch] = useState("");

    const products = [
        {
            id: 1,
            sku: "WB-REF-001",
            name: "Samsung Refrigerator",
            category: "Refrigerators",
            brand: "Samsung",
            stock: 10,
            price: 35999
        },
        {
            id: 2,
            sku: "WB-TV-002",
            name: "LG Smart TV",
            category: "Televisions",
            brand: "LG",
            stock: 8,
            price: 28999
        },
        {
            id: 3,
            sku: "WB-AC-003",
            name: "Carrier Air Conditioner",
            category: "Air Conditioners",
            brand: "Carrier",
            stock: 5,
            price: 32999
        },
        {
            id: 4,
            sku: "WB-WM-004",
            name: "Panasonic Washing Machine",
            category: "Washing Machines",
            brand: "Panasonic",
            stock: 7,
            price: 21999
        }
    ];

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container">

            <h1>Product List</h1>

            <input
                className="search"
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <table>

                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Stock</th>
                        <th>Price</th>
                    </tr>
                </thead>

                <tbody>

                    {filteredProducts.map(product => (
                        <tr key={product.id}>
                            <td>{product.sku}</td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>{product.brand}</td>
                            <td>{product.stock}</td>
                            <td>₱{product.price.toLocaleString()}</td>
                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    );
}

export default ProductList;
