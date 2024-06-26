from flask import Flask, jsonify, request
from flask_cors import CORS
from mongoengine import (
    connect,
    get_connection,
    Document,
    StringField,
    IntField,
    ReferenceField,
    DateTimeField,
)
from pymongo import MongoClient, read_concern
from bson import json_util
from bson.objectid import ObjectId
import os


# Initialize Flask and CORS
app = Flask(__name__)
cors = CORS(app)

user = os.environ.get('MONGO_USER')
password = os.environ.get('MONGO_PASS')
uri = f"mongodb+srv://{user}:{password}@cs348-ims.ug2ct7l.mongodb.net/?retryWrites=true&w=majority"
ReadConcern = read_concern.ReadConcern

# pyMongo Database Connection
#! client = MongoClient("localhost", 27017)
client = MongoClient(uri)
db = client.SaleTrackerDB

# Initiliaze Indexes
db.sales.create_index([("customer_id", 1)])
db.products.create_index([("product_id", 1)])

# MongoEngine Database Connection
#! connect("SaleTrackerDB", host="localhost", port=27017)
connect("SaleTrackerDB", host=uri)


# MongoEngine Models
class products(Document):
    name = StringField(required=True)
    category = StringField(required=True)
    price = IntField(required=True)
    product_id = IntField(required=True)
    stock_level = IntField(required=True)


class stores(Document):
    name = StringField(required=True)
    location = StringField(required=True)
    store_id = IntField(required=True)


class customers(Document):
    name = StringField(required=True)
    loyalty_points = IntField(default=0)
    customer_id = StringField(required=True)


class sales(Document):
    customer_id = IntField(required=True)
    product_id = IntField(required=True)
    store_id = IntField(required=True)
    quantity_sold = IntField(required=True)
    sale_date = StringField(required=True)


# MongoEngine Transaction Function
def start_transaction():
    connection = get_connection()
    session = connection.start_session()
    # Start a transaction
    session.start_transaction()
    return session


# pyMongo Functions
def increase_loyalty_points(customer_id):
    customer = db.customers.find_one({"customer_id": customer_id})
    if customer is None:
        return jsonify(message="Customer not found"), 404
    current_points = customer.get("loyalty_points")
    current_points = int(current_points)
    new_points = current_points + 10
    print(new_points)
    db.customers.update_one(
        {"customer_id": customer_id}, {"$set": {"loyalty_points": new_points}}
    )
    return jsonify(message="Loyalty points increased"), 201


def reduce_product_quantity(product_id, quantity_sold):
    product = db.products.find_one({"product_id": product_id})
    if product is None:
        return jsonify(message="Product not found"), 404
    current_quantity = product.get("stock_level")
    current_quantity = int(current_quantity)
    new_quantity = current_quantity - quantity_sold
    db.products.update_one(
        {"product_id": product_id}, {"$set": {"stock_level": new_quantity}}
    )
    return jsonify(message="Product stock level reduced"), 201


# stored procedures
stored_query_1 = [
    {"$match": {"customer_id": "@customer_id"}},
    {
        "$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "product_id",
            "as": "product_info"
        }
    },
    {"$unwind": "$product_info"},
    {
        "$group": {
            "_id": "$store_id",
            "count": {"$sum": 1},
            "sales": {"$push": {"customer_id": "$customer_id"}}
        }
    },
    {
        "$sort": {"count": -1}
    },
    {
        "$group": {
            "_id": None,
            "most_visited_store": {"$first": "$_id"},
            "store_count": {"$first": "$count"},
            "SalesList": {"$first": "$sales"}
        }
    },
    {
        "$project": {
            "most_visited_store": {
                    "store_id": "$most_visited_store",
                    "count": "$store_count"
                },
        }
    }
]


stored_query_2 = [
    {"$match": {"customer_id": "@customer_id"}},
    {
        "$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "product_id",
            "as": "product_info",
        }
    },
    {"$unwind": "$product_info"},
    {
        "$lookup": {
            "from": "stores",
            "localField": "store_id",
            "foreignField": "store_id",
            "as": "store_info",
        }
    },
    {"$unwind": "$store_info"},
    {
        "$group": {
            "_id": "$store_id",
            "store_name": {"$first": "$store_info.name"},
            "total_spent": {
                "$sum": {"$multiply": ["$quantity_sold", "$product_info.price"]}
            },
        }
    },
    {
        "$group": {
            "_id": None,
            "spending_per_store": {
                "$push": {
                    "k": "$store_name",
                    "v": "$total_spent",
                }
            },
        }
    },
    {
        "$replaceRoot": {
            "newRoot": {"$arrayToObject": "$spending_per_store"}
        }
    },
]

stored_query_3 = [
    {"$match": {"customer_id": "@customer_id"}},
    {
        "$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "product_id",
            "as": "product_info",
        }
    },
    {"$unwind": "$product_info"},
    {
        "$group": {
            "_id": None,
            "SalesList": {"$push": "$$ROOT"},
            "store_count": {
                "$push": {"store_id": "$store_id", "count": 1}
            },
            "category_counts": {
                "$push": "$product_info.category"
            },
        }
    },
    {
        "$project": {
            "SalesList": 1
        }
    },
]


# * Parametrized Queries (using pyMongo)


@app.route("/api/customer-report/<customer_id>", methods=["GET"])
def customer_report(customer_id):
    # ! data cleaning to remove potential injection
    query_map = {"@customer_id": int(customer_id)}
    # ! replace @customer_id with the actual customer_id
    for stage in stored_query_1:
        if "$match" in stage:
            stage["$match"]["customer_id"] = query_map["@customer_id"]

    for stage in stored_query_2:
        if "$match" in stage:
            stage["$match"]["customer_id"] = query_map["@customer_id"]
            
    for stage in stored_query_3:
        if "$match" in stage:
            stage["$match"]["customer_id"] = query_map["@customer_id"]


    with client.start_session() as session:
        with session.start_transaction(read_concern=ReadConcern("majority")):
            result1 = list(db.sales.aggregate(stored_query_1, session=session))    
            result2 = list(db.sales.aggregate(stored_query_2, session=session))
            result3 = list(db.sales.aggregate(stored_query_3, session=session))
            session.commit_transaction()

    # Combining results
    combined_results = {"Stats": result1, "SpendingPerStore": result2, "SalesList": result3}

    combined_results = json_util.dumps(combined_results)
    return combined_results


@app.route("/api/sales/<_id>", methods=["DELETE"])
def delete_sale(_id):
    _id = ObjectId(_id)
    with client.start_session() as session:
        with session.start_transaction(read_concern=ReadConcern("majority")):
            sale = db.sales.find_one({"_id": _id})
            if sale is None:
                return jsonify(message="Sale not found"), 404
            db.sales.delete_one({"_id": _id})
            session.commit_transaction()
    return jsonify(message="Sale deleted"), 200


@app.route("/api/sales/<_id>", methods=["GET"])
def get_sale(_id):
    _id = ObjectId(_id)

    with client.start_session() as session:
        with session.start_transaction(read_concern=ReadConcern("majority")):
            res = db.sales.find_one({"_id": _id})
            session.commit_transaction()

    if res is None:
        return jsonify(message="Sale not found"), 404
    json_data = json_util.dumps(res)
    return json_data


@app.route("/api/sales/<_id>", methods=["PATCH"])
def update_sale(_id):
    _id = ObjectId(_id)
    data = request.json
    product_id = data.get("productId")
    product_id = int(product_id)
    quantity_sold = data.get("quantitySold")
    quantity_sold = int(quantity_sold)
    sale_date = data.get("saleDate")
    store_id = data.get("storeId")
    store_id = int(store_id)
    customer_id = data.get("customerId")
    if customer_id == "0":
        customer_id = None
    else:
        customer_id = int(customer_id)

    with client.start_session() as session:
        with session.start_transaction(read_concern=ReadConcern("majority")):
            sale = db.sales.find_one({"_id": _id})
            if sale is None:
                return jsonify(message="Sale not found"), 404

            # check if enough stock available
            product = db.products.find_one({"product_id": product_id})
            if product is None:
                return jsonify(message="Product not found"), 404
            current_quantity = product.get("stock_level")
            current_quantity = int(current_quantity)
            if current_quantity < quantity_sold:
                return jsonify(message="Not enough stock available"), 400

            # update entry
            db.sales.update_one(
                {"_id": _id},
                {
                    "$set": {
                        "product_id": product_id,
                        "quantity_sold": quantity_sold,
                        "sale_date": sale_date,
                        "store_id": store_id,
                        "customer_id": customer_id,
                    }
                },
            )
            session.commit_transaction()
    return jsonify(message="Sale updated"), 200


@app.route("/api/sales", methods=["POST"])
def get_sales():
    if request.method == "POST":
        data = request.json
        product_id = data.get("productId")
        product_id = int(product_id)
        quantity_sold = data.get("quantitySold")
        quantity_sold = int(quantity_sold)
        sale_date = data.get("saleDate")
        store_id = data.get("storeId")
        store_id = int(store_id)
        customer_id = data.get("customerId")
        if customer_id == "0":
            customer_id = None
        else:
            customer_id = int(customer_id)

        with client.start_session() as session:
            with session.start_transaction(read_concern=ReadConcern("majority")):
                # check if enough stock available
                product = db.products.find_one({"product_id": product_id})
                if product is None:
                    return jsonify(message="Product not found"), 404
                current_quantity = product.get("stock_level")
                current_quantity = int(current_quantity)
                if current_quantity < quantity_sold:
                    return jsonify(message="Not enough stock available"), 400

                # Insert data into the sales collection
                db.sales.insert_one(
                    {
                        "product_id": product_id,
                        "quantity_sold": quantity_sold,
                        "sale_date": sale_date,
                        "store_id": store_id,
                        "customer_id": customer_id,
                    }
                )

                # Increase customer's loyalty points
                increase_loyalty_points(customer_id)
                # reduce product quantity
                reduce_product_quantity(product_id, quantity_sold)

                print(data)
                session.commit_transaction()
        return jsonify(message="New sale added"), 205


# * ORM/ODM Queries (using MongoEngine)
@app.route("/api/products", methods=["GET"])
def get_products():
    session = start_transaction()
    res = products.objects.all()
    data = []
    for entry in res:
        data_dict = entry.to_mongo().to_dict()
        data_dict["_id"] = {"$oid": str(entry.id)}
        data.append(data_dict)
    session.end_session()
    return jsonify(data)


@app.route("/api/customers", methods=["GET"])
def get_customers():
    session = start_transaction()
    res = customers.objects.all()
    data = []
    for entry in res:
        data_dict = entry.to_mongo().to_dict()
        data_dict["_id"] = {"$oid": str(entry.id)}
        data.append(data_dict)
    session.end_session()
    return jsonify(data)


@app.route("/api/stores", methods=["GET"])
def get_stores():
    session = start_transaction()
    res = stores.objects.all()
    data = []
    for entry in res:
        data_dict = entry.to_mongo().to_dict()
        data_dict["_id"] = {"$oid": str(entry.id)}
        data.append(data_dict)
    session.end_session()
    return jsonify(data)


@app.route("/api/sales", methods=["POST", "GET"])
def handle_sales():
    if request.method == "GET":
        session = start_transaction()
        res = sales.objects.all()
        data = []
        for entry in res:
            data_dict = entry.to_mongo().to_dict()
            data_dict["_id"] = {"$oid": str(entry.id)}
            data.append(data_dict)
        session.end_session()
        return jsonify(data)


@app.route("/")
def home():
    return jsonify(message="Welcome to the Sale Tracker API")


if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)
