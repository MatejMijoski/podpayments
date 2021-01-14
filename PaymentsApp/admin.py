from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import Account, TransactionsCompany, TransactionsClient, AvailableAmount, PasswordToken, FailedTransactions
from django.contrib.auth.models import Group


class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""
    password = forms.CharField(label='Password', widget=forms.PasswordInput)

    class Meta:
        model = Account
        fields = ('email',)

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    password hash display field.
    """
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = Account
        fields = ('email', 'password', 'is_active', 'is_admin')

    def clean_password(self):
        return self.initial["password"]


class AccountAdmin(UserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    fieldsets = (
        (None, {'fields': ('email', 'password', 'store_id')}),
        ('Permissions', {'fields': ('is_admin', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields':  ('email', 'password', 'store_id', 'is_active', 'is_staff', 'is_superuser')}),
    )
    list_filter = ('email',)
    list_display = ('email', 'store_id', 'store_id')
    ordering = ('email',)
    filter_horizontal = ()


class AvailableAmountAdmin(admin.ModelAdmin):
    list_display = ('user', 'available_amount')


class TransactionsClientAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_amount', 'transaction_date')


class TransactionsCompanyAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_amount', 'transaction_date', 'available_amount', 'order_id')


class FailedTransactionsAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_amount', 'transaction_date', 'order_id')


class PasswordTokenAdmin(admin.ModelAdmin):
    list_display = ('email', 'token')


# Register your models here.
admin.site.register(Account, AccountAdmin)
admin.site.register(AvailableAmount, AvailableAmountAdmin)
admin.site.register(TransactionsClient, TransactionsClientAdmin)
admin.site.register(TransactionsCompany, TransactionsCompanyAdmin)
admin.site.register(FailedTransactions, FailedTransactionsAdmin)
admin.site.register(PasswordToken, PasswordTokenAdmin)
admin.site.unregister(Group)