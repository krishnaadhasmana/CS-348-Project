import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


const Record = (props) => (
  // console.log(props),
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      {props.sale.product_name}
    </td>
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      {props.sale.quantity_sold}
    </td>
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      {props.sale.sale_date}
    </td>
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      {props.sale.store_name}
    </td>
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      {props.sale.customer_name}
    </td>
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
      <div className="flex gap-2">
        <Link
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-2"
          to={`/edit/${props.sale._id.$oid}`}
        >
          Edit
        </Link>
        <button
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-2"
          color="red"
          type="button"
          onClick={() => {
            props.deleteSale(props.sale._id.$oid);
          }}
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
);

export default function RecordList() {



const [customers, setCustomers] = useState([]);
const [products, setProducts] = useState([]);
const [stores, setStores] = useState([]);
const [sales, setSales] = useState([]);


useEffect(() => {
  // Fetch Products
  fetch('http://127.0.0.1:5000/api/products')
  .then(res => res.json())
  .then(data => setProducts(data));

// Fetch Stores
fetch('http://127.0.0.1:5000/api/stores')
  .then(res => res.json())
  .then(data => setStores(data));

// Fetch Customers
fetch('http://127.0.0.1:5000/api/customers')
  .then(res => res.json())
  .then(data => setCustomers(data));
}, []);


  // This method fetches the sales from the database.
  useEffect(() => {
    async function getSales() {
      const response = await fetch(`http://127.0.0.1:5000/api/sales`);
      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        console.error(message);
        return;
      }
      const sales = await response.json();
      // add the products, stores, and customers to the sales
      const enrichedSales = sales.map((sale) => {
        const product = products.find(product => product.product_id === sale.product_id);
        const store = stores.find(store => store.store_id === sale.store_id);
        const customer = customers.find(customer => customer.customer_id === sale.customer_id);
  
        return {
          ...sale, // Spread existing sale properties
          product_name: product ? product.name : "", // Handle missing product
          store_name: store ? store.name : "", // Handle missing store
          customer_name: customer ? customer.name : "", // Handle missing customer
        };
      });
      // console.log(sales);

      setSales(enrichedSales);
    }
    getSales();
    return;
  }, [sales.length]);

  // This method will delete a sale
  async function deleteSale(id) {
    id = id.toString();
    await fetch(`http://127.0.0.1:5000/api/sales/${id}`, {
      method: "DELETE",
    });
    const newSales = sales.filter((el) => el._id !== id);
    setSales(newSales);
  }

  // This method will map out the sales on the table
  function saleList() {
    // console.log(sales);
    return sales.map((sale) => {
      return (
        <Record
          sale={sale}
          deleteSale={() => deleteSale(sale._id.$oid)}
          key={sale._id}
        />
      );
    });
  }

  // This following section will display the table with the sales of individuals.
  return (
    <>
      <h3 className="text-lg font-semibold p-4">Retail Inventory</h3>
      <div className="border rounded-lg overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&amp;_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Product
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Quantity
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Date
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Store
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                  Customer
                </th>
              </tr>
            </thead>
            <tbody className="[&amp;_tr:last-child]:border-0">
              {saleList()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}