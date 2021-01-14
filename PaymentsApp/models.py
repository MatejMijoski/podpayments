from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password

# Create your models here.
import PaymentsApp.services
from Payments import settings


class MyAccountManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("Users must have an email address")

        user = self.model(
            email=self.normalize_email(email)
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        user = self.create_user(
            email=self.normalize_email(email),
        )

        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save(using=self._db)

        return user


class Account(AbstractBaseUser):
    email = models.EmailField(verbose_name="E-mail", max_length=40, unique=True)
    store_id = models.IntegerField(verbose_name="Store ID", default=0)
    date_joined = models.DateTimeField(verbose_name="Date joined", auto_now_add=True)
    last_login = models.DateTimeField(verbose_name="Last login", auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'

    objects = MyAccountManager()

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True

    def save(self, *args, **kwargs):
        created = not self.pk
        super().save(*args, **kwargs)
        if created:
            AvailableAmount.objects.create(user=self, available_amount=0)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwards):
    if created:
        Token.objects.create(user=instance)


class TransactionsClient(models.Model):
    objects: models.Manager()
    user = models.ForeignKey(Account, on_delete=models.CASCADE, blank=False)
    transaction_amount = models.FloatField(blank=False)
    transaction_date = models.DateTimeField(auto_now_add=True, blank=False)
    available_amount = models.FloatField(blank=False)

    def __str__(self):
        return f"Transaction: {self.transaction_date}"

    class Meta:
        verbose_name = "Client Transaction"
        verbose_name_plural = "Client Transactions"


class AvailableAmount(models.Model):
    objects: models.Manager()
    user = models.ForeignKey(Account, on_delete=models.CASCADE, blank=False)
    available_amount = models.FloatField(blank=False)

    def save(self, *args, **kwargs):
        self.available_amount = round(self.available_amount, 2)
        super(AvailableAmount, self).save(*args, **kwargs)
        PaymentsApp.services.process_failed_transactions(self, None)


    class Meta:
        verbose_name = "Available Amount"
        verbose_name_plural = "Available Amounts"


class TransactionsCompany(models.Model):
    objects: models.Manager()
    user = models.ForeignKey(Account, on_delete=models.CASCADE, blank=False)
    transaction_amount = models.FloatField(blank=False)
    transaction_date = models.DateTimeField(auto_now_add=True, blank=False)
    available_amount = models.FloatField(blank=False)
    order_id = models.IntegerField(blank=False)

    def __str__(self):
        return f"Transaction: {self.transaction_date}"

    class Meta:
        verbose_name = "Company Transaction"
        verbose_name_plural = "Company Transactions"


class PasswordToken(models.Model):
    objects: models.Manager()
    email = models.CharField(blank=False, max_length=30)
    token = models.CharField(blank=False, max_length=120)

    class Meta:
        verbose_name = "Password Token"
        verbose_name_plural = "Password Tokens"


class FailedTransactions(models.Model):
    objects: models.Manager()
    user = models.ForeignKey(Account, on_delete=models.CASCADE, blank=False)
    transaction_amount = models.FloatField(blank=False)
    transaction_date = models.DateTimeField(auto_now_add=True, blank=False)
    order_id = models.IntegerField(blank=False, unique=True)

    class Meta:
        verbose_name = "Failed Transaction"
        verbose_name_plural = "Failed Transactions"

