"""conduit URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import include
from django.urls import re_path
from django.contrib import admin
from conduit.apps.core import views as core_views

urlpatterns = [
    re_path(r'^admin/', admin.site.urls),

    # Health check endpoint
    re_path(r'^api/health$', core_views.health_check, name='health'),

    re_path(r'^api/', include(('conduit.apps.articles.urls', 'articles'), namespace='articles')),
    re_path(r'^api/', include(('conduit.apps.authentication.urls', 'authentication'), namespace='authentication')),
    re_path(r'^api/', include(('conduit.apps.profiles.urls', 'profiles'), namespace='profiles')),
]
