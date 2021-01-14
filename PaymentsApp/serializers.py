from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.Serializer):
    pk = serializers.IntegerField()
    email = serializers.EmailField()


class TransactionsSerializer(serializers.Serializer):
    transaction_amount = serializers.FloatField()
    transaction_date = serializers.DateTimeField()
    available_amount = serializers.IntegerField()


class TransactionsClientSerializer(serializers.Serializer):
    # user = UserSerializer()
    transaction_amount = serializers.FloatField()
    transaction_date = serializers.DateTimeField()
    available_amount = serializers.FloatField()


class TransactionsCompanySerializer(serializers.Serializer):
    # user = UserSerializer()
    transaction_amount = serializers.FloatField()
    transaction_date = serializers.DateTimeField()
    available_amount = serializers.FloatField()

class FailedTransactionsSerializer(serializers.Serializer):
    transaction_amount = serializers.FloatField()
    transaction_date = serializers.DateTimeField()
    order_id = serializers.IntegerField()

class AvailableAmountSerializer(serializers.Serializer):
    available_amount = serializers.FloatField()
    failed_transactions_amount = serializers.FloatField()


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True)
    new_password_repeat = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value
