from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

from PaymentsApp import views

urlpatterns = [
    path('', views.AvailableAmount1.as_view()),
    path('payments/', views.AllTransactions.as_view()),
    path('shipstation/', views.ShipStationTransactions.as_view()),
    path('login', obtain_auth_token),
    path('logout/', views.Logout.as_view()),
    path('reset-password-confirm/', views.ChangePasswordConfirm.as_view()),
    path('reset-password/', views.ChangePassword.as_view())
]