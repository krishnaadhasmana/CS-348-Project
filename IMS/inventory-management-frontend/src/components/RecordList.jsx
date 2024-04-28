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

const ReportRecord = (props) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted w-fit">
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
    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0"></td>
  </tr>
);

export default function RecordList() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [sales, setSales] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  const [customerReport, setCustomerReport] = useState({
    fav_category: "",
    most_visited_store: "",
    visit_count: "",
    loyalty_points: "",
  });
  const [customerSpending, setCustomerSpending] = useState([]);

  function updateCustomerReport(value) {
    return setCustomerReport((prev) => {
      return { ...prev, ...value };
    });
  }

  const [form, setForm] = useState({
    customerId: "",
  });

  useEffect(() => {
    // Fetch Products
    fetch("http://127.0.0.1:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));

    // Fetch Stores
    fetch("http://127.0.0.1:5000/api/stores")
      .then((res) => res.json())
      .then((data) => setStores(data));

    // Fetch Customers
    fetch("http://127.0.0.1:5000/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data));
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
        const product = products.find(
          (product) => product.product_id === sale.product_id
        );
        const store = stores.find((store) => store.store_id === sale.store_id);
        const customer = customers.find(
          (customer) => customer.customer_id === sale.customer_id
        );

        return {
          ...sale, // Spread existing sale properties
          product_name: product ? product.name : "", // Handle missing product
          store_name: store ? store.name : "", // Handle missing store
          customer_name: customer ? customer.name : "", // Handle missing customer
        };
      });
      console.log(sales);

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
    // reload the page
    window.location.reload();
  }

  // This method will map out the sales on the table
  function saleList(sales) {
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

  function reportList(sales) {
    return sales.map((sale) => {
      return (
        <ReportRecord
          sale={sale}
          deleteSale={() => deleteSale(sale._id.$oid)}
          key={sale._id}
        />
      );
    });
  }

  // These methods will update the state properties.
  function updateForm(value) {
    // console.log(form);
    return setForm((prev) => {
      return { ...prev, ...value };
    });
  }

  // This function will handle the submission.
  async function onSubmit(e) {
    e.preventDefault();
    const sale = { ...form };

    try {
      let response;
      // if we are adding a new record we will POST to /record.
      response = await fetch(
        `http://127.0.0.1:5000/api/customer-report/${form.customerId}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      response = await response.json();
      console.log("Report API: ", response);
      let store_id = response.Stats[0].most_visited_store.store_id;
      // convert id to name
      response.Stats[0].most_visited_store = stores.find(
        (store) => store.store_id === store_id
      );
      updateCustomerReport({
        most_visited_store: response.Stats[0].most_visited_store.location,
      });
      updateCustomerReport({
        visit_count: response.Stats[0].most_visited_store.count,
      });
      updateCustomerReport({
        fav_category: response.Stats[0].favorite_category,
      });
      console.log("C: ", customers);
      // find loyalty points from customer entry in customers
      const customer = await customers.find(
        (customer) => customer.customer_id == form.customerId
      );
      console.log("Customer: ", customer);
      updateCustomerReport({
        loyalty_points: customer.loyalty_points,
      });
      console.log("Customer Report: ", customerReport);
      getCustomerSales(response);

      if (response.SpendingPerStore) {
        // Convert object to array if necessary
        console.log("Responfwesbhgkjngsise: ", response.SpendingPerStore);
        const data = Object.entries(response.SpendingPerStore[0]).map(
          ([storeName, amountSpent]) => ({
            storeName,
            amountSpent,
          })
        );
        setCustomerSpending(data);
        console.log("Customer Spending: ", customerSpending);
      }
    } catch (error) {
      console.error("A problem occurred with fetching report: ", error);
    } finally {
    }
  }

  // This method fetches specific sales from the database for a report.
  async function getCustomerSales(response) {
    let res = await response;
    console.log("Res: \n", res);
    const sales = await res.Stats[0].SalesList;
    // add the products, stores, and customers to the sales
    const enrichedSales = sales.map((sale) => {
      const product = products.find(
        (product) => product.product_id === sale.product_id
      );
      const store = stores.find((store) => store.store_id === sale.store_id);
      const customer = customers.find(
        (customer) => customer.customer_id === sale.customer_id
      );

      return {
        ...sale,
        product_name: product ? product.name : "",
        store_name: store ? store.name : "",
        customer_name: customer ? customer.name : "",
      };
    });
    console.log(sales);
    setCustomerSales(enrichedSales);
  }

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
              {saleList(sales)}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-lg font-semibold p-4">Customer Report</h3>
      <form
        onSubmit={onSubmit}
        className="border rounded-lg overflow-hidden p-4 w-fit"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            name="customerId"
            onChange={(e) => updateForm({ customerId: e.target.value })}
            value={form.customerId}
            className="grid grid-cols-1 gap-x-8 gap-y-10 border-slate-900/10 md:grid-cols-2 w-fit p-2 bg-slate-100 border-black-200 border-2 rounded-md"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.name}
              </option>
            ))}
          </select>

          <input
            type="submit"
            value="Generate"
            className="m-3 inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-3 cursor-pointer"
          />
        </div>
      </form>

      {customerReport.most_visited_store && (
        <>
          <div style={{ alignItems: "center" }} className="flex pt-10 flex-row">
            <div className="border rounded-lg overflow-hidden w-fit">
              <div className="relative w-fit overflow-auto">
                <table className="w-fit caption-bottom text-sm">
                  <thead className="[&amp;_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                        Store
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                        Money Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&amp;_tr:last-child]:border-0">
                    {customerSpending.map((spending, index) => (
                      <tr
                        key={index}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                          {spending.storeName}
                        </td>
                        <td className="p-4 align-middle pl-8 [&:has([role=checkbox])]:pr-0">
                          ${spending.amountSpent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col ml-5">
              <div className="border rounded-lg overflow-hidden w-fit m-2">
                <div className="relative w-fit overflow-auto font-semibold p-4 ">
                  Most visited - {customerReport.most_visited_store}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden w-fit m-2">
                <div className="relative w-fit overflow-auto font-semibold p-4 ">
                  Loyalty Points - {customerReport.loyalty_points}
                </div>
              </div>
            </div>
          </div>

          <br />
          <br />
        </>
      )}

      {customerSales.length > 0 && (
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
                {reportList(customerSales)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
