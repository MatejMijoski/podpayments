from rest_framework import status
from rest_framework.response import Response
from .models import TransactionsClient, TransactionsCompany, AvailableAmount, Account, PasswordToken, FailedTransactions
from .serializers import TransactionsCompanySerializer, TransactionsClientSerializer, TransactionsSerializer, \
    AvailableAmountSerializer, ChangePasswordSerializer, FailedTransactionsSerializer
from rest_framework.views import APIView
from .services import *
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import requests
import os
from configparser import ConfigParser

config = ConfigParser()
config.read(r'PODPayment\Payments\db.ini')


# TODO
# OS ENVIRON - EMAIL_PASSWORD | PRODUCTION | CLIENT_ID | CLIENT_SECRET | SHIPSTATION_KEY | DJANGO_SECRET_KEY


# Create your views here.
class AllTransactions(APIView):
    """
    Get: Get all transactions
    """
    def get(self, request, format=None):
        param = self.request.query_params.get('type', None)
        transactions_client = TransactionsClient.objects.filter(user=request.user)
        transactions_company = TransactionsCompany.objects.filter(user=request.user)
        try:
            failed_transactions = FailedTransactions.objects.filter(user=request.user)
        except FailedTransactions.DoesNotExist:
            failed_transactions = None
        if param == 'client':
            client_serializer = TransactionsClientSerializer(transactions_client, context={'request': request},
                                                             many=True)
            return Response(client_serializer.data)
        elif param == 'company':
            company_serializer = TransactionsCompanySerializer(transactions_company, context={'request': request},
                                                               many=True)
            return Response(company_serializer.data)
        elif param == 'failed-transactions':
            if failed_transactions is not None:
                failed_transactions_serializer = FailedTransactionsSerializer(failed_transactions,
                                                                              context={'request': request},
                                                                              many=True)
            return Response(failed_transactions_serializer.data)
        else:
            all_serializer = TransactionsSerializer(sort_all_transactions(transactions_client, transactions_company),
                                                    context={'request': request}, many=True)
            return Response(all_serializer.data)


class AvailableAmount1(APIView):
    """
    Get: Get available ammount and failed transcactions amount
    Post: Get PayPal order and update values
    """
    def get(self, request, format=None):
        try:
            available_amount = AvailableAmount.objects.get(user=request.user)
            try:
                failed_transactions = FailedTransactions.objects.filter(user=request.user)
                failed_transactions_amount = 0
                for i in failed_transactions:
                    failed_transactions_amount += getattr(i, 'transaction_amount')
            except FailedTransactions.DoesNotExist:
                pass
            amounts = {"available_amount": getattr(available_amount, 'available_amount'),
                       "failed_transactions_amount": failed_transactions_amount}
            serializer = AvailableAmountSerializer(amounts, context={'request': request})
            return Response(serializer.data)
        except AvailableAmount.DoesNotExist:
            pass
        return Response(status=status.HTTP_404_NOT_FOUND)

    def post(self, request, format=None):
        # Find the user for the PayPal transaction and update the value in AvailableAmount
        GetOrderAndUpdate().get_order_and_update(request.data.get('orderID', None), request.user)

        # Process failed transactions after update in available amount
        try:
            process_failed_transactions(request.user)
        except FailedTransactions.DoesNotExist:
            pass

        # Save the transaction to the TransactionsClient model
        TransactionsClient.objects.create(
            user=request.user,
            transaction_amount=GetOrderAndUpdate().get_order_price(request.data.get('orderID', None)),
            available_amount=getattr(AvailableAmount.objects.get(user=request.user), 'available_amount')
        )

        return Response(status=status.HTTP_200_OK)


class Logout(APIView):
    def get(self, request, format=None):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)


class ShipStationTransactions(APIView):
    """
    Ship Station Transaction Webhook Endpoint
    """
    permission_classes = [AllowAny, ]

    def post(self, request, format=None):
        try:
            resource_url = request.data['resource_url']
            try:
                response_json = requests.get(resource_url, headers={
                    "Authorization": "Basic " + os.environ['SHIPSTATION_KEY']}).json()

                flag = False
                # Iterate the orders if there is more than one
                if next(iter(response_json)) == 'orders':
                    for i in response_json['orders']:
                        # Try to find the user with the Store ID and the Available Amount object for that user
                        # Update the value of the object
                        try:
                            user = Account.objects.get(store_id=i['advancedOptions']['storeId'])
                            obj = AvailableAmount.objects.get(user=user)

                            # Calculate price for all items in order and send in process_orders to see if there are enough funds
                            order_total = 0
                            for item in i['items']:
                                for key in pricing:
                                    if key in item['sku']:
                                        order_total += pricing[key] * item['quantity']
                            # Process the orders
                            return_number = 1
                            if order_total != 0:
                                return_number = process_orders(user, obj, order_total, i['orderId'])

                            # Put the order on hold if there aren't enough funds
                            try:
                                value = os.environ['PRODUCTION']
                                if return_number == 0:
                                    hold_or_restore(i['orderId'], True)
                            except KeyError:
                                pass

                            if float(getattr(obj, 'available_amount')) - float(order_total) < 0:
                                flag = True

                        except Account.DoesNotExist:
                            return Response(status=status.HTTP_404_NOT_FOUND)
                else:
                    try:
                        user = Account.objects.get(store_id=response_json['advancedOptions']['storeId'])
                        obj = AvailableAmount.objects.get(user=user)

                        order_total = 0
                        for item in response_json['items']:
                            for key in pricing:
                                if key in item['sku']:
                                    order_total += pricing[key]
                        # Process the orders
                        return_number = process_orders(user, obj, order_total, response_json['orderId'])

                        # Put the order on hold if there aren't enough funds
                        try:
                            value = os.environ['PRODUCTION']
                            if return_number == 0:
                                hold_or_restore(response_json['orderId'], True)
                        except KeyError:
                            pass
                        if float(getattr(obj, 'available_amount')) - float(order_total) < 0:
                            flag = True

                    except Account.DoesNotExist:
                        return Response(status=status.HTTP_404_NOT_FOUND)

                if flag:
                    send_email('Not Enough Funds',
                               'You don\'t have enough funds on your account. All of the failed orders are put on hold and will '
                               'be processed as soon as you add funds.', getattr(user, 'email'), None)
            except KeyError:
                response_json = requests.get(resource_url, headers={
                    "Authorization": "Basic" + config.get('main', 'SHIPSTATION_KEY')}).json()

        except Exception as e:
            send_email('Something went wrong with the application',
                       "Error: ".format(e) + " " + response_json, "error@mijoski.com", None)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_200_OK)


class ChangePasswordConfirm(APIView):
    """
    Change Password Confirmation Endpoint
    """
    permission_classes = [AllowAny, ]

    def put(self, request, *args, **kwargs):
        token = request.query_params.get('token')
        if token is not None:
            user_reset = PasswordToken.objects.get(token=token)
            if user_reset is not None:
                user = Account.objects.get(email=getattr(user_reset, 'email'))
                serializer = ChangePasswordSerializer(data=request.data)
                if serializer.is_valid():
                    if serializer.data.get("new_password") != serializer.data.get("new_password_repeat"):
                        return Response(status=status.HTTP_400_BAD_REQUEST)
                    user.set_password(serializer.data.get("new_password"))
                    user.save()
                    user_reset.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_400_BAD_REQUEST)


class ChangePassword(APIView):
    """
    Change Password Endpoint
    """
    permission_classes = [AllowAny, ]

    def post(self, request, format=None):
        try:
            user = Account.objects.get(email=request.data['email'])
            if user is not None:
                try:
                    filter = PasswordToken.objects.get(email=request.data['email'])
                except PasswordToken.DoesNotExist:
                    filter = None
                # Check if the user doesn't have a password reset token
                if filter is None:
                    token = generate_unique_token(PasswordToken, 'token')
                    PasswordToken.objects.create(
                        email=request.data['email'],
                        token=token,
                    )
                    send_email('Reset Password', None, request.data['email'], token)
                    return Response(status=status.HTTP_204_NO_CONTENT)

                else:
                    token = getattr(PasswordToken.objects.get(email=request.data['email']), 'token')
                    send_email('Reset Password', None, request.data['email'], token)
                    return Response(status=status.HTTP_204_NO_CONTENT)

        except Account.DoesNotExist:
            return Response(status=status.HTTP_400_BAD_REQUEST)
