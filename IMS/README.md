# Retail Inventory and Sales System

- **Concept**: A system designed for retail businesses to manage inventory across multiple locations, track sales transactions, and analyze customer buying patterns.

- **Main Table**: `Sales` (sale_id, product_id, quantity_sold, sale_date, store_id, customer_id)
    - This table records each sale, including which product was sold, in what quantity, when, at which store, and by which customer.

- **Supporting Tables**:
    - `Products` (product_id, name, category, price, stock_level)
        - Contains details about each product, including its category, price, and current stock level.
    - `Stores` (store_id, name, location)
        - Lists all store locations where products are sold.
    - `Customers` (customer_id, name, loyalty_points)
        - Holds information about each customer, including a system to track loyalty points based on their purchases.

- **Requirement 1**: An interface for entering and managing sales. This interface will allow staff to add new sales, process returns, and adjust inventory levels accordingly. Each transaction will link to a specific customer, allowing for personalized sales analytics and loyalty program management.

- **Requirement 2**: A reporting interface that offers detailed insights into sales performance by product, category, store location, and customer. This can include tracking high-demand products, identifying loyal customers, and understanding buying patterns to drive sales strategies and loyalty programs.


## Startup
Mongo start - brew services start mongodb-community@7.0
Mongo stop - brew services start mongodb-community@7.0
