from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
from bson.objectid import ObjectId


app = Flask(__name__)
CORS(app)  # Enable CORS for all domains on all routes
client = MongoClient("localhost", 27017)  # Localhost example
db = client.Inventory  # Database name


def increase_loyalty_points(customer_id):
    customer = db.customers.find_one({'customer_id': customer_id})
    if (customer is None):
        return jsonify(message='Customer not found'), 404
    current_points = customer.get('loyalty_points')
    current_points = int(current_points)
    new_points = current_points + 10
    print(new_points)
    db.customers.update_one({'customer_id': customer_id}, 
                            {'$set': {'loyalty_points': new_points}})
    return jsonify(message='Loyalty points increased'), 201


def reduce_product_quantity(product_id, quantity_sold):
    product = db.products.find_one({'product_id': product_id})
    if (product is None):
        return jsonify(message='Product not found'), 404
    current_quantity = product.get('stock_level')
    current_quantity = int(current_quantity)
    new_quantity = current_quantity - quantity_sold
    db.products.update_one({'product_id': product_id},
                           {'$set': {'stock_level': new_quantity}})
    return jsonify(message='Product stock level reduced'), 201

@app.route('/api/report/<_id>', methods=['GET'])
def get_report(_id):
    # find all sales involving customer with id _id
    _id = ObjectId(_id)
    sales = db.sales.find({'customer_id': _id})
    sales = [sale for sale in sales]
    json_data = json_util.dumps(sales)
    return json_data



@app.route('/api/products')
def get_products():
    products = db.products.find({})
    products = [product for product in products]
    json_data = json_util.dumps(products)
    return json_data


@app.route('/api/customers')
def get_customers():
    customers = db.customers.find({})
    customers = [customer for customer in customers]
    json_data = json_util.dumps(customers)
    return json_data


@app.route('/api/stores')
def get_stores():
    stores = db.stores.find({})
    stores = [store for store in stores]
    json_data = json_util.dumps(stores)
    return json_data


@app.route('/api/sales', methods=['POST', 'GET'])
def get_sales():
    if (request.method == 'GET'):
        sales = db.sales.find({})
        sales = [sale for sale in sales]
        json_data = json_util.dumps(sales)
        return json_data

    data = request.json
    product_id = data.get('productId')
    product_id = int(product_id)
    quantity_sold = data.get('quantitySold')
    quantity_sold = int(quantity_sold)
    sale_date = data.get('saleDate')
    store_id = data.get('storeId')
    store_id = int(store_id)
    customer_id = data.get('customerId')
    if (customer_id == '0'):
        customer_id = None
    else:
        customer_id = int(customer_id)
        
    # check if enough stock available
    product = db.products.find_one({'product_id': product_id})
    if (product is None):
        return jsonify(message='Product not found'), 404
    current_quantity = product.get('stock_level')
    current_quantity = int(current_quantity)
    if (current_quantity < quantity_sold):
        return jsonify(message='Not enough stock available'), 400

    # Insert data into the sales collection
    db.sales.insert_one({
        'product_id': product_id,
        'quantity_sold': quantity_sold,
        'sale_date': sale_date,
        'store_id': store_id,
        'customer_id': customer_id
    })

    # Increase customer's loyalty points
    increase_loyalty_points(customer_id)
    # reduce product quantity
    reduce_product_quantity(product_id, quantity_sold)

    print(data)

    return jsonify(message='New sale added'), 205


@app.route('/api/sales/<_id>', methods=['DELETE'])
def delete_sale(_id):
    _id = ObjectId(_id)
    sale = db.sales.find_one({'_id': _id})
    if (sale is None):
        return jsonify(message='Sale not found'), 404
    db.sales.delete_one({'_id': _id})
    return jsonify(message='Sale deleted'), 200


@app.route('/api/sales/<_id>', methods=['GET'])
def get_sale(_id):
    _id = ObjectId(_id)
    sale = db.sales.find_one({'_id': _id})
    if (sale is None):
        return jsonify(message='Sale not found'), 404
    json_data = json_util.dumps(sale)
    return json_data


@app.route('/api/sales/<_id>', methods=['PATCH'])
def update_sale(_id):
    _id = ObjectId(_id)
    data = request.json
    product_id = data.get('productId')
    product_id = int(product_id)
    quantity_sold = data.get('quantitySold')
    quantity_sold = int(quantity_sold)
    sale_date = data.get('saleDate')
    store_id = data.get('storeId')
    store_id = int(store_id)
    customer_id = data.get('customerId')
    if (customer_id == '0'):
        customer_id = None
    else:
        customer_id = int(customer_id)
    sale = db.sales.find_one({'_id': _id})
    if (sale is None):
        return jsonify(message='Sale not found'), 404

    # check if enough stock available
    product = db.products.find_one({'product_id': product_id})
    if (product is None):
        return jsonify(message='Product not found'), 404
    current_quantity = product.get('stock_level')
    current_quantity = int(current_quantity)
    if (current_quantity < quantity_sold):
        return jsonify(message='Not enough stock available'), 400

    # update entry
    db.sales.update_one({'_id': _id},
                        {'$set': {
                            'product_id': product_id,
                            'quantity_sold': quantity_sold,
                            'sale_date': sale_date,
                            'store_id': store_id,
                            'customer_id': customer_id
                        }})
    return jsonify(message='Sale updated'), 200


if __name__ == '__main__':
    app.run(debug=True)
