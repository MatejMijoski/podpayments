import json
import uuid
from itertools import chain

from django.core.mail import send_mail
from django.db import IntegrityError
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
import sys
from paypalcheckoutsdk.orders import OrdersGetRequest
import requests
from .models import AvailableAmount, TransactionsCompany, FailedTransactions
import os


pricing = {
    "MCRW": 10.50,
    "MTNK": 11.50,
    "MRAG": 13.00,
    "MCSS": 14.75,
    "MHDY": 16.00,
    "MLSC": 12.75,
    "MZIP": 18.00,
    "WTNK": 11.00,
    "WCHDY": 14.00,
    "CMFT-CRW": 13.00,
    "CMFT-TNK": 13.00,
    "CMFT-CSS": 19.50,
}


def sort_all_transactions(transactions_client, transactions_company):
    all_transactions = list(chain(transactions_client, transactions_company))
    all_transactions.sort(key=lambda x: x.transaction_date)
    return all_transactions


class PayPalClient:
    def __init__(self):
        try:
            self.client_id = os.environ['CLIENT_ID']
            self.client_secret = os.environ['CLIENT_SECRET']
            self.environment = SandboxEnvironment(client_id=self.client_id, client_secret=self.client_secret)
        except KeyError:
            self.client_id = ""
            self.client_secret = ""
            self.environment = LiveEnvironment(client_id=self.client_id, client_secret=self.client_secret)

        """Set up and return PayPal Python SDK environment with PayPal access credentials.
           This sample uses SandboxEnvironment. In production, use LiveEnvironment."""




        """ Returns PayPal HTTP client instance with environment that has access
            credentials context. Use this instance to invoke PayPal APIs, provided the
            credentials have access. """
        self.client = PayPalHttpClient(self.environment)

    def object_to_json(self, json_data):
        """
        Function to print all json data in an organized readable manner
        """
        result = {}
        if sys.version_info[0] < 3:
            itr = json_data.__dict__.iteritems()
        else:
            itr = json_data.__dict__.items()
        for key, value in itr:
            # Skip internal attributes.
            if key.startswith("__"):
                continue
            result[key] = self.array_to_json_array(value) if isinstance(value, list) else \
                self.object_to_json(value) if not self.is_primittive(value) else \
                    value
        return result

    def array_to_json_array(self, json_array):
        result = []
        if isinstance(json_array, list):
            for item in json_array:
                result.append(self.object_to_json(item) if not self.is_primittive(item) \
                                  else self.array_to_json_array(item) if isinstance(item, list) else item)
        return result;

    def is_primittive(self, data):
        return isinstance(data, str) or isinstance(data, unicode) or isinstance(data, int)


class GetOrderAndUpdate(PayPalClient):

    def get_order_and_update(self, order_id, user):
        request = OrdersGetRequest(order_id)
        response = self.client.execute(request)
        current_amount = AvailableAmount.objects.get(user=user)
        AvailableAmount.objects.filter(user=user).update(available_amount=
                                                         float(response.result.purchase_units[0].amount.value)
                                                         + getattr(current_amount, 'available_amount'))

    def get_order_price(self, order_id):
        request = OrdersGetRequest(order_id)
        response = self.client.execute(request)
        return response.result.purchase_units[0].amount.value


def generate_unique_token(Model, token_field="token", token_function=lambda: uuid.uuid4().hex[:8]):
    unique_token_found = False
    while not unique_token_found:
        token = token_function()
        # This weird looking construction is a way to pass a value to a field with a dynamic name
        if Model.objects.filter(**{token_field: token}).count() is 0:
            unique_token_found = True
    return token


def send_email(subject, message, emailTo, token):
    admin_email = "ma.mijoski@gmail.com"
    if token is None and message is not None:
        send_mail(subject, message, admin_email, [emailTo])
    else:
        message = 'Please visit this link to reset your password http://localhost:3000/change-password-confirm?token=' + token
        send_mail(subject, message, admin_email, [emailTo])


# Process the orders and subtract the order total from the user's available amount
# User is store, obj is the available amount for that user, order_total is the total price for the order and order_id
# is the id for the order
def process_orders(user, obj, order_total, order_id, failed_transaction):
    if float(getattr(obj, 'available_amount')) - float(order_total) >= 0.0:
        AvailableAmount.objects.filter(user=user).update(
            available_amount=round(float(getattr(obj, 'available_amount')) - float(order_total), 2))
        TransactionsCompany.objects.create(
            user=user,
            transaction_amount=float(order_total),
            available_amount=float(getattr(AvailableAmount.objects.get(user=user), 'available_amount')),
            order_id=order_id
        )
        return 1
    else:
        try:
            FailedTransactions.objects.create(
                user=user,
                transaction_amount=float(order_total),
                order_id=order_id,
            )
        except IntegrityError:
            pass
        return 0


# def hold_or_restore(order_id, flag):
#     if flag:
#         payload = {"orderId": order_id, "holdUntilDate": "2025-12-01"}
#         r = requests.post('https://ssapi.shipstation.com/orders/holduntil', data=payload, headers={
#             "Authorization": "Basic ZGQxNmVlM2E4ZGZjNGI4MjkyZTBkMDhlMjNiZTIxNmE6NDg2MDZjYzQxYzIyNDVlZmFiZTJjNDllNjYwZDVhMGI="})
#     else:
#         payload = {"orderId": order_id}
#         r = requests.post('https://ssapi.shipstation.com/orders/restorefromhold', data=payload, headers={
#             "Authorization": "Basic ZGQxNmVlM2E4ZGZjNGI4MjkyZTBkMDhlMjNiZTIxNmE6NDg2MDZjYzQxYzIyNDVlZmFiZTJjNDllNjYwZDVhMGI="})
