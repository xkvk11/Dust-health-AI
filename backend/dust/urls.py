from django.urls import path
from .views import predict_dust

urlpatterns = [
    path('predict/', predict_dust, name='predict_dust'),
]