import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Record() {
  const [form, setForm] = useState({
    productId: "",
    quantitySold: "",
    saleDate: "",
    storeId: "",
    customerId: "",
  });
  const [isNew, setIsNew] = useState(true);
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const id = params.id?.toString() || undefined;
      if (!id) return;
      setIsNew(false);
      console.log(id);
      const response = await fetch(
        `https://eng-flux-421708.uc.r.appspot.com/api/sales/${params.id.toString()}`,
        // `http://127.0.0.1:5000/api/sales/${params.id.toString()}`,
        {
          method: "GET",
        }
      );

      // console.log(response);
      if (!response.ok) {
        const message = `An error has occurred: ${response.statusText}`;
        console.error(message);
        return;
      }
      const record = await response.json();
      // console.log(record);
      if (!record) {
        console.warn(`Record with id ${id} not found`);
        navigate("/");
        return;
      }
      record.saleDate = record.sale_date;
      record.productId = record.product_id;
      record.storeId = record.store_id;
      record.customerId = record.customer_id;
      record.quantitySold = record.quantity_sold;
      setForm(record);
    }
    fetchData();
    return;
  }, [params.id, navigate]);

  // These methods will update the state properties.
  function updateForm(value) {
    console.log(form);
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
      if (isNew) {
        // if we are adding a new record we will POST to /record.
        response = await fetch("https://eng-flux-421708.uc.r.appspot.com/api/sales", {
        // response = await ("http://127.0.0.1:5000/api/sales", {

          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sale),
        });
      } else {
        // if we are updating a record we will PATCH to /record/:id.
        response = await fetch(`https://eng-flux-421708.uc.r.appspot.com/api/sales/${params.id}`, {
        // response = await fetch(`http://127.0.0.1:5000/api/sales/${params.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sale),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("A problem occurred with your fetch operation: ", error);
    } finally {
      setForm({
        productId: "",
        quantitySold: "",
        saleDate: "",
        storeId: "",
        customerId: "",
      });
      navigate("/");
    }
  }

  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch Products
    fetch("https://eng-flux-421708.uc.r.appspot.com/api/products")
    // fetch("http://127.0.0.1:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));

    // Fetch Stores
    fetch("https://eng-flux-421708.uc.r.appspot.com/api/stores")
    // fetch("http://127.0.0.1:5000/api/stores")
      .then((res) => res.json())
      .then((data) => setStores(data));

    // Fetch Customers
    fetch("https://eng-flux-421708.uc.r.appspot.com/api/customers")
    // fetch("http://127.0.0.1:5000/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data));
  }, []);

  // This following section will display the form that takes the input from the user.
  return (
    <div className="w-1/2 mx-auto" >
      <h3 className="text-lg font-semibold p-4">Create/Update Sale Record</h3>
      <form
        onSubmit={onSubmit}
        className="border rounded-lg overflow-hidden p-4"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-900/10 pb-12 md:grid-cols-2">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 ">
            <select
              name="productId"
              onChange={(e) => updateForm({ productId: e.target.value })}
              value={form.productId}
              className="grid grid-cols-1 gap-x-8 gap-y-10 border-slate-900/10 md:grid-cols-2 w-fit p-2 bg-slate-100 border-black-200 border-2 rounded-md"
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>

            <select
              name="storeId"
              onChange={(e) => updateForm({ storeId: e.target.value })}
              value={form.storeId}
              className="grid grid-cols-1 gap-x-8 gap-y-10 border-slate-900/10 md:grid-cols-2 w-fit p-2 bg-slate-100 border-black-200 border-2 rounded-md"
              required
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option key={store.store_id} value={store.store_id}>
                  {store.name}
                </option>
              ))}
            </select>

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
              <option value="0">Unknown</option>
            </select>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 ">
            <div className="sm:col-span-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-slate-900"
              >
                Date of Sale
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md w-fit">
                  <input
                    type="date"
                    name="saleDate"
                    id="saleDate"
                    className="block flex-1 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 w-fit p-2 bg-slate-100 border-black-200 border-2 rounded-md"
                    value={form.saleDate}
                    onChange={(e) => updateForm({ saleDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="position"
                className="block text-sm font-medium leading-6 text-slate-900"
              >
                Quantity Sold
              </label>
              <div className="mt-2 w-fit">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="number"
                    name="quantitySold"
                    id="quantitySold"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 p-2 bg-slate-100 border-black-200 border-2 rounded-md"
                    placeholder="1"
                    value={form.quantitySold}
                    onChange={(e) =>
                      updateForm({ quantitySold: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <input
          type="submit"
          value="Save Sale Record"
          className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-3 cursor-pointer mt-4"
        />
      </form>
    </div>
  );
}
